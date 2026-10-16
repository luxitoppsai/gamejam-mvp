import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH, TILE_SIZE } from "@vov/core";
import { createDemoArena, ITEMS, ROLES, roleOf } from "@vov/gameplay";
import type { Arena, ArenaEvent, MockFireModel } from "@vov/gameplay";
import { buildFountain, DUNGEON_KEY, FOUNTAIN_KEY, InputSources, TOWN_KEY, WorldRenderer } from "@vov/view";
import type { Slot } from "@vov/view";

/** Frames de Kenney Tiny Dungeon (referencia) para los 4 brigadistas. */
const PLAYER_FRAMES = [85, 99, 112, 86];
const PLAYER_COLORS = ["#7fd4ff", "#ff9ec7", "#9be564", "#ffd23f"];

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

interface View {
  sprite: Phaser.GameObjects.Sprite;
  icon: Phaser.GameObjects.Sprite;
}

export class MainScene extends Phaser.Scene {
  arena!: Arena<MockFireModel>;
  private terrain!: WorldRenderer;
  private sources!: InputSources;
  private gfx!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private itemSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private views = new Map<number, View>();
  private log: string[] = [];
  private fullView = false;
  private cam = { x: 6 * TILE_SIZE, y: 14 * TILE_SIZE, zoom: 1 };
  private restoreSlots: Slot[] = [];

  constructor() {
    super("MainScene");
  }

  init(data: { slots?: Slot[] }): void {
    this.restoreSlots = data.slots ?? [];
    this.log = [];
    this.itemSprites = new Map();
    this.views = new Map();
  }

  preload(): void {
    this.load.spritesheet(TOWN_KEY, "assets/kenney/town.png", { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet(DUNGEON_KEY, "assets/kenney/dungeon.png", { frameWidth: 16, frameHeight: 16 });
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
    this.gfx = this.add.graphics().setDepth(1);
    this.fx = this.add.graphics().setDepth(1000);
    buildFountain(this);
    for (const f of this.arena.fountains) {
      this.add.image((f.x + 0.5) * TILE_SIZE, (f.y + 0.5) * TILE_SIZE, FOUNTAIN_KEY).setDepth(2);
    }
    this.sources = new InputSources(this, (slot) => this.arena.addPlayer(slot.id));
    this.sources.restore(this.restoreSlots);
    if (this.sources.slots.length === 0) this.sources.addKeyboard(0);
    this.arena.onEvent((e) => this.record(e));
    this.input.keyboard?.on("keydown-V", () => (this.fullView = !this.fullView));
    this.cameras.main.setZoom(1);
    window.addEventListener("keydown", (ev) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(ev.key)) ev.preventDefault();
    });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.arena.update(dt, this.sources.poll());
    this.terrain.update(time);
    this.syncItems(time);
    this.syncPlayers(time);
    this.drawFx(time);
    this.updateCamera();
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

  // ---- render de entidades ----
  private syncItems(time: number): void {
    const alive = new Set<number>();
    for (const it of this.arena.groundItems) {
      alive.add(it.uid);
      let s = this.itemSprites.get(it.uid);
      if (!s) {
        s = this.add.sprite(it.x, it.y, TOWN_KEY, ITEMS[it.kind].icon).setOrigin(0.5, 0.7);
        this.itemSprites.set(it.uid, s);
      }
      s.setPosition(it.x, it.y + Math.sin(time / 300 + it.uid) * 1.2).setDepth(it.y);
    }
    for (const [uid, s] of this.itemSprites) {
      if (!alive.has(uid)) {
        s.destroy();
        this.itemSprites.delete(uid);
      }
    }
  }

  private syncPlayers(time: number): void {
    this.gfx.clear();
    for (const f of this.arena.fountains) {
      const r = 10 + Math.sin(time / 400) * 1.5;
      this.gfx.lineStyle(1, 0x7fd4ff, 0.7).strokeCircle((f.x + 0.5) * TILE_SIZE, (f.y + 0.5) * TILE_SIZE, r);
    }
    for (const it of this.arena.groundItems) {
      this.gfx.fillStyle(0x000000, 0.28).fillEllipse(it.x, it.y + 1, 9, 3);
    }
    this.arena.players.forEach((p, i) => {
      let v = this.views.get(p.id);
      if (!v) {
        v = {
          sprite: this.add.sprite(p.x, p.y, DUNGEON_KEY, PLAYER_FRAMES[i % 4]!).setOrigin(0.5, 0.85),
          icon: this.add.sprite(p.x, p.y, TOWN_KEY, 0).setScale(0.8).setVisible(false),
        };
        this.views.set(p.id, v);
      }
      const role = roleOf(p.item?.kind);
      const color = role ? ROLES[role].color : 0xb0b0b0;
      this.gfx.fillStyle(color, 0.28).fillEllipse(p.x, p.y + 1, 13, 5);
      this.gfx.lineStyle(1.5, color, 1).strokeEllipse(p.x, p.y + 1, 13, 5);
      v.sprite.setPosition(p.x, p.y).setDepth(p.y).setFlipX(p.fx < 0);
      if (p.item) {
        v.icon.setVisible(true).setFrame(ITEMS[p.item.kind].icon).setPosition(p.x, p.y - 16 + Math.sin(time / 250) * 0.8).setDepth(p.y + 1);
      } else v.icon.setVisible(false);
    });
  }

  private drawFx(time: number): void {
    const g = this.fx;
    g.clear();
    for (const p of this.arena.players) {
      if (p.spraying && p.item) {
        const range = ITEMS[p.item.kind].range * TILE_SIZE;
        const lx = -p.fy;
        const ly = p.fx;
        for (let k = 0; k < 16; k++) {
          const d = 8 + Math.random() * range;
          const spread = (d / range) * 5 * (Math.random() * 2 - 1);
          g.fillStyle([0x8fd8ff, 0xffffff, 0x3aa0ff][k % 3]!, 0.9);
          g.fillRect(p.x + p.fx * d + lx * spread - 1, p.y - 4 + p.fy * d + ly * spread - 1, 2, 2);
        }
      }
      if (p.item && ITEMS[p.item.kind].capacity > 0) {
        const frac = p.item.water / ITEMS[p.item.kind].capacity;
        g.fillStyle(0x000000, 0.6).fillRect(p.x - 7, p.y - 27, 14, 3);
        g.fillStyle(frac > 0.25 ? 0x3aa0ff : 0xff5a3a, 1).fillRect(p.x - 6, p.y - 26, 12 * frac, 1);
      }
      if (p.action) {
        const x = (p.action.cx + 0.5) * TILE_SIZE;
        const y = p.action.cy * TILE_SIZE - 3;
        g.fillStyle(0x000000, 0.7).fillRect(x - 8, y, 16, 3);
        g.fillStyle(p.action.kind === "dig" ? 0xd08a3a : 0x5fd35f, 1).fillRect(x - 7, y + 1, 14 * (p.action.t / p.action.total), 1);
      }
    }
    void time;
  }

  private updateCamera(): void {
    const cam = this.cameras.main;
    const ps = this.arena.players;
    let tx = this.arena.width * TILE_SIZE * 0.5;
    let ty = this.arena.height * TILE_SIZE * 0.5;
    let tz = 0.5;
    if (!this.fullView && ps.length > 0) {
      const xs = ps.map((p) => p.x);
      const ys = ps.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const m = 48;
      tx = (minX + maxX) / 2;
      ty = (minY + maxY) / 2;
      tz = Math.min(1, Math.max(0.5, Math.min(BASE_WIDTH / (maxX - minX + 2 * m), BASE_HEIGHT / (maxY - minY + 2 * m))));
    }
    const k = 0.12;
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cam.zoom += (tz - this.cam.zoom) * k;
    cam.setZoom(this.cam.zoom);
    const halfW = BASE_WIDTH / 2 / this.cam.zoom;
    const halfH = BASE_HEIGHT / 2 / this.cam.zoom;
    const mapW = this.arena.width * TILE_SIZE;
    const mapH = this.arena.height * TILE_SIZE;
    cam.centerOn(Math.min(Math.max(this.cam.x, halfW), mapW - halfW), Math.min(Math.max(this.cam.y, halfH), mapH - halfH));
  }

  private record(e: ArenaEvent): void {
    if (e.type !== "command") return;
    const c = e.command;
    if (c.type === "extinguish" || c.type === "transferWater" || c.type === "refill") return; // demasiado frecuentes para el registro
    const name = c.type === "swapItem" ? `toma/suelta: ${c.item ?? "nada"}` : c.type === "digFirebreak" ? `zanja (${c.x},${c.y})` : c.type === "plant" ? `planta (${c.x},${c.y})` : c.type;
    this.log.push(`J${e.playerId}: ${name}`);
  }
}