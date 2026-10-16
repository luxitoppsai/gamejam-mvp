import { DEFAULT_SEED, TILE_SIZE } from "@vov/core";
import { CellularFire, GRASS, FOREST, WindController, generateVegetation, mulberry32 } from "@vov/fire";
import { Arena } from "./Arena";
import type { PlayerInput } from "./Arena";
import { MATCH } from "./matchParams";
import type { ItemKind } from "./roles/items";
import { PARAMS } from "./roles/params";

export type Phase = "prep" | "fire" | "reforest" | "closing";
export type Outcome = "win" | "lose-burned" | "lose-time";

export interface MatchOptions {
  seed?: number;
  /** Lado del mapa en celdas (cuadrado). */
  size?: number;
  /** Fracción quemada que provoca la derrota. */
  loseFraction?: number;
  /** Duraciones en segundos; por defecto las de matchParams (balance.md). */
  prepSeconds?: number;
  reforestSeconds?: number;
  /** Velocidad del fuego respecto a la de la PoC 1 al empezar y tras `fireRampSeconds` de incendio. */
  fireSpeedStart?: number;
  fireSpeedEnd?: number;
  fireRampSeconds?: number;
  /** Cantidad de focos iniciales. */
  foci?: number;
  /** Multiplicador de la potencia de extinción. */
  extinguishScale?: number;
}

export interface MatchSummary {
  outcome: Outcome | null;
  burnedCells: number;
  regrownCells: number;
  goal: number;
  planted: number;
  matureTrees: number;
  seconds: number;
}

/**
 * Una partida completa (lógica pura, sin Phaser): mapa generado con la semilla, fuego real,
 * viento, la arena con jugadores e ítems, y la máquina de fases
 * preparación -> incendio -> reforestación -> cierre (M16) con victoria/derrota.
 */
export class Match {
  readonly seed: number;
  readonly size: number;
  readonly fire: CellularFire;
  readonly wind: WindController;
  readonly arena: Arena<CellularFire>;
  /** 1 donde una celda quemada ya se regeneró (un árbol adulto regenera su celda y las 4 vecinas). */
  readonly regrown: Uint8Array;
  phase: Phase = "prep";
  /** Segundos transcurridos en la fase actual. */
  phaseTime = 0;
  /** Segundos totales de partida. */
  elapsed = 0;
  outcome: Outcome | null = null;
  /** Celdas quemadas al terminar el incendio (base de la meta de regeneración). */
  burnedAtFireEnd = 0;
  regrownCount = 0;

  private readonly opts: Required<Pick<MatchOptions, "loseFraction" | "prepSeconds" | "reforestSeconds" | "foci" | "fireSpeedStart" | "fireSpeedEnd" | "fireRampSeconds">>;
  private readonly matured = new Set<number>();
  private statsTimer = 0;
  private lastBurnedFraction = 0;
  private lastBurning = 0;
  private ignited = false;
  private extraSources: { x: number; y: number }[] = [];

  constructor(opts: MatchOptions = {}) {
    this.seed = opts.seed ?? DEFAULT_SEED;
    this.size = opts.size ?? MATCH.mapSize;
    this.opts = {
      loseFraction: opts.loseFraction ?? MATCH.loseFraction,
      prepSeconds: opts.prepSeconds ?? MATCH.prepSeconds,
      reforestSeconds: opts.reforestSeconds ?? MATCH.reforestSeconds,
      foci: opts.foci ?? MATCH.foci,
      fireSpeedStart: opts.fireSpeedStart ?? MATCH.fireSpeedStart,
      fireSpeedEnd: opts.fireSpeedEnd ?? MATCH.fireSpeedEnd,
      fireRampSeconds: opts.fireRampSeconds ?? MATCH.fireRampSeconds,
    };
    const n = this.size * this.size;
    const vegetation = generateVegetation(this.size, this.size, this.seed);
    const base = this.baseZone();
    for (let y = base.y0; y <= base.y1; y++) for (let x = base.x0; x <= base.x1; x++) vegetation[y * this.size + x] = GRASS;
    const sources = this.waterSources();
    for (const f of sources) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) vegetation[(f.y + dy) * this.size + f.x + dx] = GRASS;
    this.fire = new CellularFire({ width: this.size, height: this.size, seed: this.seed, vegetation });
    this.wind = new WindController(this.fire, this.seed, 0, 0.6);
    const terrain = Uint8Array.from(vegetation, (v) => (v === FOREST ? 1 : 0));
    this.extraSources = sources;
    this.arena = new Arena<CellularFire>({
      width: this.size,
      height: this.size,
      fire: this.fire,
      terrain,
      fireSpeed: () => this.currentFireSpeed(),
      extinguishScale: opts.extinguishScale ?? MATCH.extinguishScale,
      spawn: { x: base.x0 + 3, y: Math.floor((base.y0 + base.y1) / 2) - 1 },
    });
    this.regrown = new Uint8Array(n);
    this.populateBase();
  }

  /** Zona de la brigada (sin árboles), a la izquierda y centrada verticalmente. */
  baseZone(): { x0: number; y0: number; x1: number; y1: number } {
    const cy = Math.floor(this.size / 2);
    return { x0: 2, y0: cy - 9, x1: 20, y1: cy + 9 };
  }

  /** Fuentes naturales repartidas por el mapa al este de la base (jitter determinista por semilla). */
  private waterSources(): { x: number; y: number }[] {
    const rng = mulberry32((this.seed ^ 0x7a31c2d5) >>> 0);
    const out: { x: number; y: number }[] = [];
    const s = this.size;
    const cols = 4;
    const rows = 3;
    const x0 = this.baseZone().x1 + 8;
    const cw = (s - 6 - x0) / cols;
    const rh = (s - 8) / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        out.push({ x: Math.floor(x0 + (c + 0.2 + rng() * 0.6) * cw), y: Math.floor(4 + (r + 0.2 + rng() * 0.6) * rh) });
      }
    }
    return out;
  }

  /** El fuego empieza lento y se intensifica (el día se calienta): da una ventana para contenerlo temprano. */
  private currentFireSpeed(): number {
    const { fireSpeedStart: a, fireSpeedEnd: b, fireRampSeconds: r } = this.opts;
    const t = this.phase === "fire" ? Math.min(1, this.phaseTime / r) : this.phase === "prep" ? 0 : 1;
    return a + (b - a) * t;
  }

  get goal(): number {
    return Math.max(1, Math.ceil(this.burnedAtFireEnd * MATCH.regenGoal));
  }

  /** Salta lo que queda de la preparación. */
  skipPrep(): void {
    if (this.phase === "prep") this.startFire();
  }

  update(dt: number, inputs: ReadonlyMap<number, PlayerInput> = new Map()): void {
    this.elapsed += dt;
    this.phaseTime += dt;
    this.arena.update(dt, this.phase === "closing" ? new Map<number, PlayerInput>() : inputs);
    if (this.phase === "fire") this.wind.update(dt);
    this.growSaplings();

    this.statsTimer += dt;
    if (this.statsTimer >= 0.25) {
      this.statsTimer = 0;
      const st = this.fire.stats();
      this.lastBurnedFraction = st.burnedFraction;
      this.lastBurning = st.burning;
    }

    switch (this.phase) {
      case "prep":
        if (this.phaseTime >= this.opts.prepSeconds) this.startFire();
        break;
      case "fire":
        if (this.lastBurnedFraction >= this.opts.loseFraction) this.finish("lose-burned");
        else if (this.ignited && this.lastBurning === 0) this.startReforest();
        break;
      case "reforest":
        if (this.regrownCount >= this.goal) this.finish("win");
        else if (this.phaseTime >= this.opts.reforestSeconds) this.finish("lose-time");
        break;
      case "closing":
        break;
    }
  }

  get burnedFraction(): number {
    return this.lastBurnedFraction;
  }

  get burning(): number {
    return this.lastBurning;
  }

  /** Segundos que quedan en la fase actual (0 si no tiene límite). */
  get phaseRemaining(): number {
    if (this.phase === "prep") return Math.max(0, this.opts.prepSeconds - this.phaseTime);
    if (this.phase === "reforest") return Math.max(0, this.opts.reforestSeconds - this.phaseTime);
    return 0;
  }

  summary(): MatchSummary {
    return {
      outcome: this.outcome,
      burnedCells: this.burnedAtFireEnd || this.fire.stats().burned,
      regrownCells: this.regrownCount,
      goal: this.goal,
      planted: this.arena.saplings.size,
      matureTrees: this.arena.matureCount(),
      seconds: this.elapsed,
    };
  }

  private enter(phase: Phase): void {
    this.phase = phase;
    this.phaseTime = 0;
  }

  private startFire(): void {
    this.enter("fire");
    this.ignite();
  }

  /** Pocos focos al este de la base, con posición determinista a partir de la semilla. */
  private ignite(): void {
    const rng = mulberry32((this.seed ^ 0x1f3d5b79) >>> 0);
    const s = this.size;
    const cy = Math.floor(s / 2);
    const foci = this.opts.foci;
    for (let k = 0; k < foci; k++) {
      const x = Math.floor(s * (MATCH.igniteFrom + rng() * (MATCH.igniteTo - MATCH.igniteFrom)));
      const y = Math.min(s - 3, Math.max(2, cy + Math.round((rng() * 2 - 1) * s * 0.3)));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.fire.ignite(x + dx, y + dy);
    }
    this.ignited = true;
    this.lastBurning = this.fire.stats().burning;
  }

  private startReforest(): void {
    this.burnedAtFireEnd = this.fire.stats().burned;
    this.enter("reforest");
  }

  private finish(outcome: Outcome): void {
    if (this.burnedAtFireEnd === 0) this.burnedAtFireEnd = this.fire.stats().burned;
    this.outcome = outcome;
    this.enter("closing");
  }

  /** Un brote adulto regenera su celda y las 4 vecinas quemadas. */
  private growSaplings(): void {
    const done = PARAMS.growthSeconds * (PARAMS.growthStages - 1);
    const s = this.size;
    for (const [i, age] of this.arena.saplings) {
      if (age < done || this.matured.has(i)) continue;
      this.matured.add(i);
      const x = i % s;
      const y = (i - x) / s;
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= s || ny >= s) continue;
        const j = ny * s + nx;
        if (this.regrown[j] || this.fire.states[j] !== 2 || this.fire.isFirebreak(nx, ny)) continue;
        this.regrown[j] = 1;
        this.regrownCount++;
      }
    }
  }

  private populateBase(): void {
    const b = this.baseZone();
    const cy = Math.floor((b.y0 + b.y1) / 2);
    const items: [ItemKind, number, number][] = [
      ["hose", b.x0 + 7, cy - 3], ["hose", b.x0 + 7, cy + 3], ["extinguisher", b.x0 + 8, cy],
      ["backpack", b.x0 + 6, cy - 1], ["backpack", b.x0 + 6, cy + 1],
      ["shovel", b.x0 + 9, cy - 3], ["shovel", b.x0 + 9, cy + 3],
      ["seeds", b.x0 + 10, cy - 1], ["seeds", b.x0 + 10, cy + 1], ["seeds", b.x0 + 10, cy + 4],
      ["radio", b.x0 + 9, cy],
    ];
    for (const [kind, tx, ty] of items) this.arena.spawnItem(kind, (tx + 0.5) * TILE_SIZE, (ty + 0.5) * TILE_SIZE);
    this.arena.fountains.push({ x: b.x0 + 1, y: cy - 5 }, { x: b.x0 + 1, y: cy + 5 }, ...this.extraSources);
  }
}
