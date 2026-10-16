import Phaser from "phaser";
import { DEFAULT_SEED, TILE_SIZE } from "@vov/core";
import { ITEMS, Match, ROLES, roleOf } from "@vov/gameplay";
import type { ArenaEvent, MatchSummary, Outcome, Phase } from "@vov/gameplay";
import { ArenaView, InputSources, loadKenney, PLAYER_COLORS, WorldRenderer } from "@vov/view";
import type { Slot } from "@vov/view";

export type Status = "menu" | "playing";

export interface HudPlayer {
  id: number;
  color: string;
  role: string | null;
  roleColor: string | null;
  item: string | null;
  waterPct: number | null;
}

export interface HudState {
  status: Status;
  phase: Phase;
  /** Segundos que quedan en la fase (0 si no tiene límite). */
  remaining: number;
  burnedPct: number;
  loseAtPct: number;
  burning: number;
  windDeg: number;
  windStrength: number;
  regrown: number;
  goal: number;
  planted: number;
  matureTrees: number;
  players: HudPlayer[];
  banner: string;
  outcome: Outcome | null;
  summary: MatchSummary;
  log: string[];
  fullView: boolean;
  seed: number;
}

const BANNERS: Record<Phase, string> = {
  prep: "Preparación: tomen herramientas en la base. El fuego empieza pronto.",
  fire: "¡Incendio! Contengan el fuego antes de que arrase el bosque.",
  reforest: "El fuego se apagó. Siembren sobre la ceniza para regenerar el bosque.",
  closing: "",
};
const CLOSING: Record<Outcome, string> = {
  win: "El bosque se recupera.",
  "lose-burned": "El fuego arrasó el bosque.",
  "lose-time": "Se acabó el tiempo de reforestación.",
};

export class PlayScene extends Phaser.Scene {
  match!: Match;
  status: Status = "menu";
  private world!: WorldRenderer;
  private view!: ArenaView;
  private sources!: InputSources;
  private seed = DEFAULT_SEED;
  private restoreSlots: Slot[] = [];
  private autostart = false;
  private fullView = false;
  private lastPhase: Phase = "prep";
  private log: string[] = [];

  constructor() {
    super("PlayScene");
  }

  init(data: { seed?: number; slots?: Slot[]; autostart?: boolean }): void {
    if (data.seed !== undefined) this.seed = data.seed;
    this.restoreSlots = data.slots ?? [];
    this.autostart = data.autostart ?? false;
    this.status = "menu";
    this.log = [];
    this.fullView = false;
  }

  preload(): void {
    loadKenney(this);
  }

  create(): void {
    this.match = new Match({ seed: this.seed });
    const m = this.match;
    const a = m.arena;
    const f = m.fire;
    this.world = new WorldRenderer(this, {
      width: m.size,
      height: m.size,
      vegetation: f.vegetation,
      states: f.states,
      regrown: m.regrown,
      isFirebreak: (x, y) => f.isFirebreak(x, y),
      saplingStage: (x, y) => a.saplingStage(x, y),
    });
    const b = m.baseZone();
    this.view = new ArenaView(this, a, { x: (b.x0 + 8) * TILE_SIZE, y: ((b.y0 + b.y1) / 2) * TILE_SIZE });
    this.sources = new InputSources(this, (slot) => a.addPlayer(slot.id));
    this.sources.restore(this.restoreSlots);
    a.onEvent((e) => this.record(e));
    this.lastPhase = m.phase;
    this.input.keyboard?.on("keydown-V", () => (this.fullView = !this.fullView));
    this.input.keyboard?.on("keydown-ENTER", () => this.onEnter());
    window.addEventListener("keydown", (ev) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(ev.key)) ev.preventDefault();
    });
    if (this.autostart) this.start(Math.max(1, this.sources.slots.length));
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    const inputs = this.sources.poll();
    if (this.status === "playing") {
      this.match.update(dt, inputs);
      if (this.match.phase !== this.lastPhase) {
        this.lastPhase = this.match.phase;
        this.log.push(`fase: ${this.match.phase}`);
      }
    }
    this.world.update(time);
    this.view.update(time, this.fullView);
  }

  // ---- API para el DOM ----
  /** Empieza la partida con `players` jugadores de teclado (los gamepads se unen al pulsar un botón). */
  start(players: number): void {
    while (this.sources.slots.length < players) if (this.sources.addKeyboard() === null) break;
    this.status = "playing";
  }

  restart(nextSeed = false): void {
    this.scene.restart({ seed: nextSeed ? this.seed + 1 : this.seed, slots: this.sources.slots.slice(), autostart: true });
  }

  toBase(): void {
    this.scene.restart({ seed: this.seed, slots: [], autostart: false });
  }

  toggleView(): boolean {
    this.fullView = !this.fullView;
    return this.fullView;
  }

  private onEnter(): void {
    if (this.status === "menu") this.start(Math.max(1, this.sources.slots.length));
    else if (this.match.phase === "prep") this.match.skipPrep();
    else if (this.match.phase === "closing") this.restart(true);
  }

  getHud(): HudState {
    const m = this.match;
    const outcome = m.outcome;
    return {
      status: this.status,
      phase: m.phase,
      remaining: m.phaseRemaining,
      burnedPct: m.burnedFraction * 100,
      loseAtPct: 70,
      burning: m.burning,
      windDeg: (m.wind.current.direction * 180) / Math.PI,
      windStrength: m.wind.current.strength,
      regrown: m.regrownCount,
      goal: m.phase === "prep" || m.phase === "fire" ? 0 : m.goal,
      planted: m.arena.saplings.size,
      matureTrees: m.arena.matureCount(),
      players: m.arena.players.map((p, i) => {
        const role = roleOf(p.item?.kind);
        const def = p.item ? ITEMS[p.item.kind] : null;
        return {
          id: p.id,
          color: PLAYER_COLORS[i % 4]!,
          role: role ? ROLES[role].label : null,
          roleColor: role ? "#" + ROLES[role].color.toString(16).padStart(6, "0") : null,
          item: def ? def.label : null,
          waterPct: def && def.capacity > 0 ? Math.round((p.item!.water / def.capacity) * 100) : null,
        };
      }),
      banner: m.phase === "closing" && outcome ? CLOSING[outcome] : BANNERS[m.phase],
      outcome,
      summary: m.summary(),
      log: this.log.slice(-5),
      fullView: this.fullView,
      seed: this.seed,
    };
  }

  private record(e: ArenaEvent): void {
    const c = e.command;
    if (c.type === "extinguish" || c.type === "transferWater" || c.type === "refill") return;
    const name = c.type === "swapItem" ? `toma/suelta: ${c.item ?? "nada"}` : c.type === "digFirebreak" ? "zanja" : c.type === "plant" ? "siembra" : c.type;
    this.log.push(`J${e.playerId}: ${name}`);
  }
}
