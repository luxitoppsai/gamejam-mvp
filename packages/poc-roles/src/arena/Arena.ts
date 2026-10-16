import { TILE_SIZE } from "@vov/core";
import type { PlayerCommand } from "@vov/core";
import { MockFireModel } from "../mock/MockFireModel";
import { ITEMS, roleOf, usesWater } from "../roles/items";
import type { ItemKind, Role } from "../roles/items";
import { PARAMS } from "../roles/params";
import { generateTerrain } from "./map";

export interface PlayerInput {
  moveX: number;
  moveY: number;
  /** Tomar/soltar (se detecta el flanco de subida dentro de la arena). */
  interact: boolean;
  /** Usar el ítem en mano (mantenido). */
  use: boolean;
}
export const IDLE_INPUT: PlayerInput = { moveX: 0, moveY: 0, interact: false, use: false };

export interface ItemInstance {
  uid: number;
  kind: ItemKind;
  x: number;
  y: number;
  /** El tanque pertenece al ítem: si se suelta, el agua se queda con él. */
  water: number;
}

export interface PlayerState {
  id: number;
  x: number;
  y: number;
  /** Dirección de cara (un eje, -1/0/1). */
  fx: number;
  fy: number;
  item: ItemInstance | null;
  spraying: boolean;
  /** Acción larga en curso (zanja o siembra) con su progreso en segundos. */
  action: { kind: "dig" | "plant"; cx: number; cy: number; t: number; total: number } | null;
}

export type ArenaEvent =
  | { type: "command"; playerId: number; command: PlayerCommand }
  | { type: "transfer"; fromId: number; toId: number }
  | { type: "refill"; playerId: number };

export interface ArenaOptions {
  width?: number;
  height?: number;
  seed?: number;
  /** Si es false no se colocan ítems, fuentes ni fuego iniciales (para pruebas). */
  populate?: boolean;
}

/**
 * Mundo de la PoC 2: lógica pura (sin Phaser). Resuelve movimiento, ítems/roles dinámicos,
 * agua, zanjas y siembra, y emite PlayerCommand. La escena solo traduce entrada y dibuja.
 */
export class Arena {
  readonly width: number;
  readonly height: number;
  readonly fire: MockFireModel;
  readonly terrain: Uint8Array;
  readonly fountains: { x: number; y: number }[] = [];
  readonly players: PlayerState[] = [];
  readonly groundItems: ItemInstance[] = [];
  readonly saplings = new Set<number>();
  private listeners: ((e: ArenaEvent) => void)[] = [];
  private prevInteract = new Map<number, boolean>();
  private cmdTimers = new Map<number, number>();
  private nextUid = 1;

  constructor(opts: ArenaOptions = {}) {
    this.width = opts.width ?? 40;
    this.height = opts.height ?? 28;
    this.fire = new MockFireModel(this.width, this.height);
    const populate = opts.populate ?? true;
    const clear = (x: number, y: number) =>
      !populate || x <= 14 || (y >= 13 && y <= 15) || Math.hypot(x - 36, y - 14) < 4;
    this.terrain = generateTerrain(this.width, this.height, opts.seed ?? 1337, clear);
    if (populate) this.populate();
  }

  onEvent(fn: (e: ArenaEvent) => void): void {
    this.listeners.push(fn);
  }

  /** Ítems, fuentes y primer foco de la demo. */
  private populate(): void {
    const items: [ItemKind, number, number][] = [
      ["hose", 9, 12], ["hose", 9, 16], ["extinguisher", 10, 14],
      ["backpack", 8, 13], ["backpack", 8, 15],
      ["shovel", 11, 12], ["shovel", 11, 16],
      ["seeds", 12, 14], ["radio", 12, 12],
    ];
    for (const [kind, tx, ty] of items) this.spawnItem(kind, (tx + 0.5) * TILE_SIZE, (ty + 0.5) * TILE_SIZE);
    this.fountains.push({ x: 2, y: 9 }, { x: 2, y: 19 });
    this.fire.ignite(36, 14);
  }

  spawnItem(kind: ItemKind, x: number, y: number): ItemInstance {
    const it: ItemInstance = { uid: this.nextUid++, kind, x, y, water: ITEMS[kind].capacity };
    this.groundItems.push(it);
    return it;
  }

  addPlayer(id: number): PlayerState {
    const i = this.players.length;
    const p: PlayerState = {
      id,
      x: (4 + (i % 2) * 1.5 + 0.5) * TILE_SIZE,
      y: (13 + Math.floor(i / 2) * 2 + 0.5) * TILE_SIZE,
      fx: 1,
      fy: 0,
      item: null,
      spraying: false,
      action: null,
    };
    this.players.push(p);
    return p;
  }

  teleport(id: number, x: number, y: number): void {
    const p = this.player(id);
    p.x = x;
    p.y = y;
  }

  player(id: number): PlayerState {
    const p = this.players.find((q) => q.id === id);
    if (!p) throw new Error(`jugador ${id} no existe`);
    return p;
  }

  roleOf(id: number): Role | null {
    return roleOf(this.player(id).item?.kind);
  }

  /** Un tile es obstáculo si está fuera del mapa o tiene árbol sin quemar. */
  solidAt(cx: number, cy: number): boolean {
    if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) return true;
    return this.terrain[cy * this.width + cx]! > 0 && this.fire.states[cy * this.width + cx] !== 2;
  }

  hasSapling(cx: number, cy: number): boolean {
    return this.saplings.has(cy * this.width + cx);
  }

  update(dt: number, inputs: ReadonlyMap<number, PlayerInput>): void {
    for (const p of this.players) {
      const input = inputs.get(p.id) ?? IDLE_INPUT;
      this.move(p, input, dt);
      const pressed = input.interact && !this.prevInteract.get(p.id);
      this.prevInteract.set(p.id, input.interact);
      if (pressed) this.interact(p);
      this.use(p, input.use, dt);
      if (p.item) {
        p.item.x = p.x;
        p.item.y = p.y;
      }
    }
    this.fire.step(dt);
  }

  // ---- movimiento ----
  private move(p: PlayerState, input: PlayerInput, dt: number): void {
    const len = Math.hypot(input.moveX, input.moveY);
    if (len < 0.01) return;
    const vx = (input.moveX / len) * PARAMS.playerSpeed * dt;
    const vy = (input.moveY / len) * PARAMS.playerSpeed * dt;
    if (Math.abs(input.moveX) >= Math.abs(input.moveY)) {
      p.fx = Math.sign(input.moveX);
      p.fy = 0;
    } else {
      p.fx = 0;
      p.fy = Math.sign(input.moveY);
    }
    if (!this.blockedAt(p.x + vx, p.y)) p.x += vx;
    if (!this.blockedAt(p.x, p.y + vy)) p.y += vy;
  }

  private blockedAt(x: number, y: number): boolean {
    const h = PARAMS.playerHalf;
    for (const [ox, oy] of [[-h, -h], [h, -h], [-h, h], [h, h]] as const) {
      if (this.solidAt(Math.floor((x + ox) / TILE_SIZE), Math.floor((y + oy) / TILE_SIZE))) return true;
    }
    return false;
  }

  // ---- tomar / soltar (M02) ----
  private interact(p: PlayerState): void {
    let target: ItemInstance | null = null;
    let best: number = PARAMS.interactRange;
    for (const it of this.groundItems) {
      const d = Math.hypot(it.x - p.x, it.y - p.y);
      if (d <= best) {
        best = d;
        target = it;
      }
    }
    if (p.item) this.drop(p);
    if (target) {
      this.groundItems.splice(this.groundItems.indexOf(target), 1);
      p.item = target;
    }
    this.emit(p, { type: "swapItem", item: p.item?.kind ?? null });
  }

  private drop(p: PlayerState): void {
    if (!p.item) return;
    p.item.x = p.x;
    p.item.y = p.y;
    this.groundItems.push(p.item);
    p.item = null;
    p.action = null;
  }

  // ---- usar el ítem (M03, M09) ----
  private use(p: PlayerState, held: boolean, dt: number): void {
    p.spraying = false;
    const it = p.item;
    if (!held || !it) {
      p.action = null;
      return;
    }
    switch (it.kind) {
      case "hose":
      case "extinguisher":
        this.spray(p, it, dt);
        break;
      case "backpack":
        this.supportWater(p, it, dt);
        break;
      case "shovel":
        this.longAction(p, "dig", PARAMS.digSeconds, dt, (cx, cy) => {
          const i = cy * this.width + cx;
          return !this.solidAt(cx, cy) && !this.fire.isFirebreak(cx, cy) && this.fire.states[i] !== 1;
        }, (cx, cy) => {
          this.fire.setFirebreak(cx, cy, true);
          this.emit(p, { type: "digFirebreak", x: cx, y: cy });
        });
        break;
      case "seeds":
        this.longAction(p, "plant", PARAMS.plantSeconds, dt, (cx, cy) => {
          const i = cy * this.width + cx;
          return !this.solidAt(cx, cy) && !this.fire.isFirebreak(cx, cy) && this.fire.states[i] === 2 && !this.hasSapling(cx, cy);
        }, (cx, cy) => {
          this.saplings.add(cy * this.width + cx);
          this.emit(p, { type: "plant", x: cx, y: cy, species: "nativa" });
        });
        break;
      case "radio":
        break; // Vigía: sin función en la PoC (M13 es opcional).
    }
  }

  private spray(p: PlayerState, it: ItemInstance, dt: number): void {
    const def = ITEMS[it.kind];
    if (it.water <= 0) return;
    const spent = Math.min(it.water, def.drain * dt);
    it.water -= spent;
    const eff = spent / def.drain; // fracción de tiempo con agua real
    p.spraying = true;
    const tx = Math.floor(p.x / TILE_SIZE);
    const ty = Math.floor(p.y / TILE_SIZE);
    const lx = -p.fy;
    const ly = p.fx;
    let aimed: { x: number; y: number } | null = null;
    for (let d = 1; d <= def.range; d++) {
      const cx = tx + p.fx * d;
      const cy = ty + p.fy * d;
      if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) break;
      const wide = it.kind === "extinguisher" ? d <= 2 : d >= 3;
      const offsets = wide ? [-1, 0, 1] : [0];
      for (const o of offsets) {
        const ex = cx + lx * o;
        const ey = cy + ly * o;
        if (ex >= 0 && ey >= 0 && ex < this.width && ey < this.height) this.fire.extinguish(ex, ey, def.power * eff);
      }
      aimed = { x: cx, y: cy };
      if (this.solidAt(cx, cy)) break;
    }
    if (aimed && this.cmdReady(p.id, dt)) this.emit(p, { type: "extinguish", x: aimed.x, y: aimed.y });
  }

  /** Soporte: pasa agua a un Sofocador cercano o, si no hay, recarga su mochila en una fuente. */
  private supportWater(p: PlayerState, pack: ItemInstance, dt: number): void {
    for (const q of this.players) {
      if (q === p || !q.item || !usesWater(q.item.kind)) continue;
      if (Math.hypot(q.x - p.x, q.y - p.y) > PARAMS.supportRange) continue;
      const cap = ITEMS[q.item.kind].capacity;
      if (q.item.water >= cap || pack.water <= 0) continue;
      const amount = Math.min(PARAMS.transferRate * dt, pack.water, cap - q.item.water);
      pack.water -= amount;
      q.item.water += amount;
      this.listeners.forEach((fn) => fn({ type: "transfer", fromId: p.id, toId: q.id }));
      return;
    }
    const cap = ITEMS.backpack.capacity;
    if (pack.water < cap && this.nearFountain(p)) {
      pack.water = Math.min(cap, pack.water + PARAMS.fountainRate * dt);
      this.listeners.forEach((fn) => fn({ type: "refill", playerId: p.id }));
    }
  }

  nearFountain(p: PlayerState): boolean {
    return this.fountains.some(
      (f) => Math.hypot((f.x + 0.5) * TILE_SIZE - p.x, (f.y + 0.5) * TILE_SIZE - p.y) <= PARAMS.fountainRange,
    );
  }

  private longAction(
    p: PlayerState,
    kind: "dig" | "plant",
    total: number,
    dt: number,
    valid: (cx: number, cy: number) => boolean,
    done: (cx: number, cy: number) => void,
  ): void {
    const cx = Math.floor(p.x / TILE_SIZE) + p.fx;
    const cy = Math.floor(p.y / TILE_SIZE) + p.fy;
    if (!valid(cx, cy)) {
      p.action = null;
      return;
    }
    if (!p.action || p.action.kind !== kind || p.action.cx !== cx || p.action.cy !== cy) {
      p.action = { kind, cx, cy, t: 0, total };
    }
    p.action.t += dt;
    if (p.action.t >= total) {
      done(cx, cy);
      p.action = null;
    }
  }

  private cmdReady(id: number, dt: number): boolean {
    const t = (this.cmdTimers.get(id) ?? 0) + dt;
    if (t >= 1 / PARAMS.commandHz) {
      this.cmdTimers.set(id, 0);
      return true;
    }
    this.cmdTimers.set(id, t);
    return false;
  }

  private emit(p: PlayerState, command: PlayerCommand): void {
    this.listeners.forEach((fn) => fn({ type: "command", playerId: p.id, command }));
  }
}