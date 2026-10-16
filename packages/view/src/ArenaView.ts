import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH, TILE_SIZE } from "@vov/core";
import { ITEMS, ROLES, roleOf } from "@vov/gameplay";
import type { Arena } from "@vov/gameplay";
import { buildItemIcons } from "./icons";
import { buildDrone, buildFountain, DRONE_KEY, DUNGEON_KEY, FOUNTAIN_KEY, TOWN_KEY } from "./tileset";

/** Frames de Kenney Tiny Dungeon (referencia) para los 4 brigadistas. */
const PLAYER_FRAMES = [85, 99, 112, 86];
export const PLAYER_COLORS = ["#7fd4ff", "#ff9ec7", "#9be564", "#ffd23f"];

interface PlayerSprites {
  sprite: Phaser.GameObjects.Sprite;
  icon: Phaser.GameObjects.Sprite;
  drone: Phaser.GameObjects.Sprite;
}

/** Radio de visión del dron en tiles (igual que MATCH.droneVision) para dibujar su anillo. */
const DRONE_RING_TILES = 12;
/** Ventana de la cámara del dron, en píxeles del lienzo base. */
const PIP = { w: 104, h: 72, margin: 4 };

/** Carga los spritesheets de Kenney (referencia) que ArenaView y el tileset necesitan. */
export function loadKenney(scene: Phaser.Scene, base = "assets/kenney"): void {
  scene.load.spritesheet(TOWN_KEY, `${base}/town.png`, { frameWidth: 16, frameHeight: 16 });
  scene.load.spritesheet(DUNGEON_KEY, `${base}/dungeon.png`, { frameWidth: 16, frameHeight: 16 });
}

/**
 * Dibuja las entidades de una Arena (jugadores, ítems, fuentes, agua, barras de acción) y mueve
 * una cámara que sigue al equipo con zoom adaptativo. No contiene reglas: solo lee la Arena.
 */
export class ArenaView {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly fx: Phaser.GameObjects.Graphics;
  private readonly itemSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private readonly players = new Map<number, PlayerSprites>();
  private cam: { x: number; y: number; zoom: number };
  /** Hacia dónde mira la cámara cuando todavía no hay jugadores. */
  private readonly idleFocus: { x: number; y: number };
  private readonly pip: Phaser.Cameras.Scene2D.Camera;
  private readonly pipBorder: Phaser.Cameras.Scene2D.Camera;

  constructor(private readonly scene: Phaser.Scene, private readonly arena: Arena, start = { x: 6 * TILE_SIZE, y: 14 * TILE_SIZE }) {
    this.gfx = scene.add.graphics().setDepth(1);
    this.fx = scene.add.graphics().setDepth(1000);
    this.cam = { x: start.x, y: start.y, zoom: 1 };
    this.idleFocus = start;
    buildFountain(scene);
    buildDrone(scene);
    buildItemIcons(scene);
    const px = BASE_WIDTH - PIP.w - PIP.margin;
    // Marco: una cámara detrás mirando a la nada (solo se ve su color de fondo alrededor de la ventana).
    this.pipBorder = scene.cameras.add(px - 2, PIP.margin - 2, PIP.w + 4, PIP.h + 4).setBackgroundColor(0x9be564).setScroll(-1e6, -1e6).setVisible(false);
    this.pip = scene.cameras.add(px, PIP.margin, PIP.w, PIP.h).setBackgroundColor(0x000000).setVisible(false);
    for (const f of arena.fountains) {
      scene.add.image((f.x + 0.5) * TILE_SIZE, (f.y + 0.5) * TILE_SIZE, FOUNTAIN_KEY).setDepth(2);
    }
    scene.cameras.main.setZoom(1);
  }

  update(time: number, fullView = false): void {
    this.syncItems(time);
    this.syncPlayers(time);
    this.drawFx();
    this.drawMarkers(time);
    this.updatePip();
    this.updateCamera(fullView);
  }

  private syncItems(time: number): void {
    const alive = new Set<number>();
    for (const it of this.arena.groundItems) {
      alive.add(it.uid);
      let s = this.itemSprites.get(it.uid);
      if (!s) {
        const def = ITEMS[it.kind];
        s = this.scene.add.sprite(it.x, it.y, def.iconKey ?? TOWN_KEY, def.iconKey ? 0 : def.icon).setOrigin(0.5, 0.7);
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
      let v = this.players.get(p.id);
      if (!v) {
        v = {
          sprite: this.scene.add.sprite(p.x, p.y, DUNGEON_KEY, PLAYER_FRAMES[i % 4]!).setOrigin(0.5, 0.85),
          icon: this.scene.add.sprite(p.x, p.y, TOWN_KEY, 0).setScale(0.8).setVisible(false),
          drone: this.scene.add.sprite(p.x, p.y, DRONE_KEY).setVisible(false).setDepth(900),
        };
        this.players.set(p.id, v);
      }
      const role = roleOf(p.item?.kind);
      const color = role ? ROLES[role].color : 0xb0b0b0;
      this.gfx.fillStyle(color, 0.28).fillEllipse(p.x, p.y + 1, 13, 5);
      this.gfx.lineStyle(1.5, color, 1).strokeEllipse(p.x, p.y + 1, 13, 5);
      v.sprite.setPosition(p.x, p.y).setDepth(p.y).setFlipX(p.fx < 0);
      if (p.item) {
        const def = ITEMS[p.item.kind];
        v.icon.setVisible(true).setTexture(def.iconKey ?? TOWN_KEY, def.iconKey ? 0 : def.icon).setPosition(p.x, p.y - 16 + Math.sin(time / 250) * 0.8).setDepth(p.y + 1);
      } else v.icon.setVisible(false);
      v.drone.setVisible(p.drone.active);
      if (p.drone.active) {
        v.drone.setPosition(p.drone.x, p.drone.y - 8 + Math.sin(time / 120) * 1.2).setAngle(Math.sin(time / 90) * 6);
        this.gfx.fillStyle(0x000000, 0.25).fillEllipse(p.drone.x, p.drone.y + 2, 9, 3);
      }
    });
  }

  private drawFx(): void {
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
      if (p.drone.active) {
        g.lineStyle(1, 0x7fd4ff, 0.35).lineBetween(p.x, p.y - 8, p.drone.x, p.drone.y - 8);
        g.lineStyle(1, 0x7fd4ff, 0.3).strokeCircle(p.drone.x, p.drone.y, DRONE_RING_TILES * TILE_SIZE);
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
  }

  /** Marcas de zona de riesgo del Vigía: bandera roja con anillo que pulsa. */
  private drawMarkers(time: number): void {
    const g = this.fx;
    for (const m of this.arena.markers) {
      const x = (m.x + 0.5) * TILE_SIZE;
      const y = (m.y + 0.5) * TILE_SIZE;
      const pulse = 8 + ((time / 60) % 10);
      g.lineStyle(1, 0xff5a3a, 0.8 - (pulse - 8) / 14).strokeCircle(x, y, pulse);
      g.fillStyle(0x2b0f1f, 1).fillRect(x - 1, y - 12, 2, 13);
      g.fillStyle(0xff3a2a, 1).fillTriangle(x + 1, y - 12, x + 9, y - 8, x + 1, y - 4);
    }
  }

  /** Ventana con la cámara del dron mientras algún Vigía lo esté pilotando. */
  private updatePip(): void {
    const flyer = this.arena.players.find((p) => p.drone.active);
    this.pip.setVisible(!!flyer);
    this.pipBorder.setVisible(!!flyer);
    if (flyer) this.pip.setZoom(1).centerOn(flyer.drone.x, flyer.drone.y);
  }

  private updateCamera(fullView: boolean): void {
    const cam = this.scene.cameras.main;
    const ps = this.arena.players;
    const mapW = this.arena.width * TILE_SIZE;
    const mapH = this.arena.height * TILE_SIZE;
    let tx = mapW * 0.5;
    let ty = mapH * 0.5;
    let tz = Math.min(BASE_WIDTH / mapW, BASE_HEIGHT / mapH);
    if (!fullView && ps.length === 0) {
      tx = this.idleFocus.x;
      ty = this.idleFocus.y;
      tz = 1;
    } else if (!fullView) {
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
    const clamp = (v: number, half: number, size: number) => (size <= half * 2 ? size / 2 : Math.min(Math.max(v, half), size - half));
    cam.centerOn(clamp(this.cam.x, halfW, mapW), clamp(this.cam.y, halfH, mapH));
  }
}
