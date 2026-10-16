import type { CellFireState, FireCell, FireModel, Vegetation } from "@vov/core";
import {
  BURN_STEPS,
  BURNED,
  BURNING,
  DEFAULT_SEED,
  DIAGONAL_WEIGHT,
  FOREST,
  GRASS,
  MAX_CATCHUP_STEPS,
  SHRUB,
  SPREAD_PROBABILITY,
  STEP_SECONDS,
  UNBURNED,
  WIND_MAX_MULTIPLIER,
  WIND_MIN_MULTIPLIER,
} from "./params";
import { fnv1a, mulberry32 } from "./rng";
import { generateVegetation } from "./vegetation";

const DX = [-1, 0, 1, -1, 1, -1, 0, 1];
const DY = [-1, -1, -1, 0, 0, 1, 1, 1];
const LEN = DX.map((dx, k) => Math.hypot(dx, DY[k]!));
const NEIGHBOR_WEIGHT = DX.map((dx, k) => (dx !== 0 && DY[k] !== 0 ? DIAGONAL_WEIGHT : 1));

const STATE_NAME: readonly CellFireState[] = ["unburned", "burning", "burned"];
const VEG_NAME: readonly Vegetation[] = ["grass", "shrub", "forest"];

export interface CellularFireOptions {
  width: number;
  height: number;
  seed?: number;
  /** Vegetación por celda (0 pastizal, 1 matorral, 2 bosque). Si falta, se genera con la semilla. */
  vegetation?: Uint8Array;
}

/**
 * Autómata celular de propagación del fuego. Lógica pura y determinista:
 * sin Phaser, sin Math.random() ni Date.now(). Misma semilla y mismas entradas => mismo estado.
 *
 * Convención del viento: `direction` en radianes hacia donde SOPLA (0 = +x/este, PI/2 = +y/sur en pantalla).
 */
export class CellularFire implements FireModel {
  readonly width: number;
  readonly height: number;
  readonly seed: number;
  /** Estado por celda (UNBURNED/BURNING/BURNED). Solo lectura para el render. */
  readonly states: Uint8Array;
  readonly vegetation: Uint8Array;
  /** Pasos de combustión restantes (solo relevante en BURNING). */
  readonly burnLeft: Uint8Array;

  private readonly rng: () => number;
  private readonly pending: Uint8Array;
  private readonly pendingList: Int32Array;
  private readonly windMul = new Float64Array(8).fill(1);
  private windDirection = 0;
  private windStrength = 0;
  private acc = 0;
  private _tick = 0;

  constructor(opts: CellularFireOptions) {
    const { width, height } = opts;
    this.width = width;
    this.height = height;
    this.seed = opts.seed ?? DEFAULT_SEED;
    const n = width * height;
    this.states = new Uint8Array(n);
    this.burnLeft = new Uint8Array(n);
    this.pending = new Uint8Array(n);
    this.pendingList = new Int32Array(n);
    this.vegetation = opts.vegetation ?? generateVegetation(width, height, this.seed);
    if (this.vegetation.length !== n) throw new RangeError("vegetation no coincide con width*height");
    this.rng = mulberry32(this.seed);
    this.setWind(0, 0);
  }

  get tick(): number {
    return this._tick;
  }

  get wind(): { direction: number; strength: number } {
    return { direction: this.windDirection, strength: this.windStrength };
  }

  step(dt: number): void {
    this.acc = Math.min(this.acc + dt, STEP_SECONDS * MAX_CATCHUP_STEPS);
    while (this.acc >= STEP_SECONDS - 1e-9) {
      this.acc -= STEP_SECONDS;
      this.advance();
    }
  }

  getCell(x: number, y: number): FireCell {
    const i = this.index(x, y);
    return { state: STATE_NAME[this.states[i]!]!, vegetation: VEG_NAME[this.vegetation[i]!]! };
  }

  ignite(x: number, y: number): void {
    if (!this.inBounds(x, y)) return;
    const i = y * this.width + x;
    if (this.states[i] !== UNBURNED) return;
    this.states[i] = BURNING;
    this.burnLeft[i] = BURN_STEPS[this.vegetation[i]!]!;
  }

  /** Quita `amount` pasos de combustión restantes; si llega a 0 la celda queda quemada (ceniza). */
  extinguish(x: number, y: number, amount: number): void {
    if (!this.inBounds(x, y)) return;
    const i = y * this.width + x;
    if (this.states[i] !== BURNING) return;
    const left = this.burnLeft[i]! - Math.max(0, amount);
    if (left <= 0) {
      this.burnLeft[i] = 0;
      this.states[i] = BURNED;
    } else {
      this.burnLeft[i] = Math.ceil(left);
    }
  }

  setWind(direction: number, strength: number): void {
    this.windDirection = direction;
    this.windStrength = Math.min(1, Math.max(0, strength));
    for (let k = 0; k < 8; k++) {
      const cos = (DX[k]! * Math.cos(direction) + DY[k]! * Math.sin(direction)) / LEN[k]!;
      this.windMul[k] =
        cos >= 0
          ? 1 + this.windStrength * cos * (WIND_MAX_MULTIPLIER - 1)
          : 1 + this.windStrength * cos * (1 - WIND_MIN_MULTIPLIER);
    }
  }

  /** Checksum FNV-1a del estado de la cuadrícula (estados + combustible restante). */
  checksum(): number {
    return fnv1a(this.states, this.burnLeft);
  }

  stats(): { unburned: number; burning: number; burned: number; burnedFraction: number } {
    let burning = 0;
    let burned = 0;
    const s = this.states;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === BURNING) burning++;
      else if (s[i] === BURNED) burned++;
    }
    const total = s.length;
    return { unburned: total - burning - burned, burning, burned, burnedFraction: (burning + burned) / total };
  }

  private advance(): void {
    const { width: w, height: h, states, burnLeft, vegetation, pending, pendingList, rng, windMul } = this;
    let nPending = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (states[i] !== BURNING) continue;
        for (let k = 0; k < 8; k++) {
          const nx = x + DX[k]!;
          const ny = y + DY[k]!;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (states[j] !== UNBURNED || pending[j]) continue;
          const p = SPREAD_PROBABILITY[vegetation[j]!]! * NEIGHBOR_WEIGHT[k]! * windMul[k]!;
          if (rng() < p) {
            pending[j] = 1;
            pendingList[nPending++] = j;
          }
        }
        if (--burnLeft[i]! <= 0) states[i] = BURNED;
      }
    }
    for (let n = 0; n < nPending; n++) {
      const j = pendingList[n]!;
      pending[j] = 0;
      states[j] = BURNING;
      burnLeft[j] = BURN_STEPS[vegetation[j]!]!;
    }
    this._tick++;
  }

  private inBounds(x: number, y: number): boolean {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  private index(x: number, y: number): number {
    if (!this.inBounds(x, y)) throw new RangeError(`celda fuera de rango: (${x}, ${y})`);
    return y * this.width + x;
  }
}

export { GRASS, SHRUB, FOREST };