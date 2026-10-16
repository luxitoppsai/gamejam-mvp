import type { FireCell, FireModel } from "@vov/core";

const UNBURNED = 0;
const BURNING = 1;
const BURNED = 2;
const NAME = ["unburned", "burning", "burned"] as const;

/** Paso fijo del mock en segundos. */
const TICK = 0.25;
/** Segundos ardiendo antes de contagiar a los vecinos ortogonales. */
export const IGNITE_AFTER = 2;
/** Segundos que arde una celda antes de quedar en ceniza. */
export const BURN_TIME = 10;
/** Calor inicial de una celda: hay que rociarla hasta bajarlo a 0. */
export const CELL_HEAT = 100;

/**
 * Fuego "de mentira" para la PoC 2 (no es el de la PoC 1): regla fija y determinista.
 * Una celda ardiendo contagia a sus 4 vecinos tras IGNITE_AFTER s y se consume tras BURN_TIME s.
 * Implementa FireModel completo (incluido el cortafuego).
 */
export class MockFireModel implements FireModel {
  readonly states: Uint8Array;
  private readonly age: Float32Array;
  private readonly heat: Float32Array;
  private readonly firebreak: Uint8Array;
  private acc = 0;

  constructor(readonly width: number, readonly height: number) {
    const n = width * height;
    this.states = new Uint8Array(n);
    this.age = new Float32Array(n);
    this.heat = new Float32Array(n);
    this.firebreak = new Uint8Array(n);
  }

  step(dt: number): void {
    this.acc = Math.min(this.acc + dt, 1);
    while (this.acc >= TICK - 1e-9) {
      this.acc -= TICK;
      this.tick();
    }
  }

  getCell(x: number, y: number): FireCell {
    return { state: NAME[this.states[this.idx(x, y)]!]!, vegetation: "grass" };
  }

  ignite(x: number, y: number): void {
    if (!this.inBounds(x, y)) return;
    const i = y * this.width + x;
    if (this.states[i] !== UNBURNED || this.firebreak[i]) return;
    this.states[i] = BURNING;
    this.age[i] = 0;
    this.heat[i] = CELL_HEAT;
  }

  extinguish(x: number, y: number, amount: number): void {
    if (!this.inBounds(x, y)) return;
    const i = y * this.width + x;
    if (this.states[i] !== BURNING) return;
    this.heat[i] = this.heat[i]! - Math.max(0, amount);
    if (this.heat[i]! <= 0) this.states[i] = BURNED;
  }

  setWind(): void {
    /* El mock ignora el viento. */
  }

  setFirebreak(x: number, y: number, on: boolean): void {
    if (this.inBounds(x, y)) this.firebreak[y * this.width + x] = on ? 1 : 0;
  }

  isFirebreak(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.firebreak[y * this.width + x] === 1;
  }

  stats(): { burning: number; burned: number; unburned: number } {
    let burning = 0;
    let burned = 0;
    for (const s of this.states) {
      if (s === BURNING) burning++;
      else if (s === BURNED) burned++;
    }
    return { burning, burned, unburned: this.states.length - burning - burned };
  }

  private tick(): void {
    const { width: w, height: h, states, age } = this;
    const toIgnite: number[] = [];
    for (let i = 0; i < states.length; i++) {
      if (states[i] !== BURNING) continue;
      age[i] = age[i]! + TICK;
      if (age[i]! >= IGNITE_AFTER) {
        const x = i % w;
        const y = (i - x) / w;
        if (x > 0) toIgnite.push(i - 1);
        if (x < w - 1) toIgnite.push(i + 1);
        if (y > 0) toIgnite.push(i - w);
        if (y < h - 1) toIgnite.push(i + w);
      }
      if (age[i]! >= BURN_TIME) states[i] = BURNED;
    }
    for (const j of toIgnite) this.ignite(j % w, (j - (j % w)) / w);
  }

  private inBounds(x: number, y: number): boolean {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  private idx(x: number, y: number): number {
    if (!this.inBounds(x, y)) throw new RangeError(`celda fuera de rango: (${x}, ${y})`);
    return y * this.width + x;
  }
}