import Phaser from "phaser";
import { createDemoArena, ITEMS, ROLES, roleOf } from "@vov/gameplay";
import type { Arena, ArenaEvent, MockFireModel } from "@vov/gameplay";
import { ArenaView, InputSources, loadKenney, PLAYER_COLORS, WorldRenderer } from "@vov/view";
import type { Slot } from "@vov/view";

export interface HudPlayer {
  id: number;
  color: string;
  role: string | null;
  roleColor: string | null;
  item: string | null;
  waterPct: number | null;
}
export interface HudState {
  players: HudPlayer[];
  burning: number;
  burnedPct: number;
  saplings: number;
  log: string[];
  fullView: boolean;
}

export class MainScene extends Phaser.Scene {
  arena!: Arena<MockFireModel>;
  private terrain!: WorldRenderer;
  private sources!: InputSources;
  private view!: ArenaView;
  private log: string[] = [];
  private fullView = false;
  private restoreSlots: Slot[] = [];

  constructor() {
    super("MainScene");
  }

  init(data: { slots?: Slot[] }): void {
    this.restoreSlots = data.slots ?? [];
    this.log = [];
  }

  preload(): void {
    loadKenney(this);
  }

  create(): void {
    this.arena = createDemoArena();
    const a = this.arena;
    // Terreno de la demo: 0 pasto, 1-2 pino, 3 arbusto -> vegetación 0 / 2 / 1 del renderer.
    const vegetation = Uint8Array.from(a.terrain, (k) => (k === 0 ? 0 : k === 3 ? 1 : 2));
    this.terrain = new WorldRenderer(this, {
      width: a.width,
      height: a.height,
      vegetation,
      states: a.fire.states,
      isFirebreak: (x, y) => a.fire.isFirebreak(x, y),
      saplingStage: (x, y) => a.saplingStage(x, y),
    });
    this.view = new ArenaView(this, this.arena);
    this.sources = new InputSources(this, (slot) => this.arena.addPlayer(slot.id));
    this.sources.restore(this.restoreSlots);
    if (this.sources.slots.length === 0) this.sources.addKeyboard(0);
    this.arena.onEvent((e) => this.record(e));
    this.input.keyboard?.on("keydown-V", () => (this.fullView = !this.fullView));
    window.addEventListener("keydown", (ev) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(ev.key)) ev.preventDefault();
    });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.arena.update(dt, this.sources.poll());
    this.terrain.update(time);
    this.view.update(time, this.fullView);
  }

  // ---- API para el panel (DOM) ----
  addKeyboardPlayer(): boolean {
    return this.sources.addKeyboard() !== null;
  }
  restart(): void {
    this.scene.restart({ slots: this.sources.slots.slice() });
  }
  toggleView(): boolean {
    this.fullView = !this.fullView;
    return this.fullView;
  }
  getHud(): HudState {
    const st = this.arena.fire.stats();
    const total = this.arena.width * this.arena.height;
    return {
      players: this.arena.players.map((p, i) => {
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
      burning: st.burning,
      burnedPct: ((st.burning + st.burned) / total) * 100,
      saplings: this.arena.saplings.size,
      log: this.log.slice(-6),
      fullView: this.fullView,
    };
  }

  private record(e: ArenaEvent): void {
    if (e.type !== "command") return;
    const c = e.command;
    if (c.type === "extinguish" || c.type === "transferWater" || c.type === "refill") return; // demasiado frecuentes para el registro
    const name = c.type === "swapItem" ? `toma/suelta: ${c.item ?? "nada"}` : c.type === "digFirebreak" ? `zanja (${c.x},${c.y})` : c.type === "plant" ? `planta (${c.x},${c.y})` : c.type;
    this.log.push(`J${e.playerId}: ${name}`);
  }
}