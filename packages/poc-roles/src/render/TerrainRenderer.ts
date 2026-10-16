import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";
import type { Arena } from "../arena/Arena";
import { buildTileset, FLAME_FRAMES, GRASS_VARIANTS, TILE, TILESET_KEY } from "./tileset";

const FLAME_MS = 110;
const hash = (a: number): number => {
  let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

/** Tilemap de la arena: pasto, árboles, fuego mock, ceniza, zanjas y brotes. */
export class TerrainRenderer {
  private readonly tiles: Phaser.Tilemaps.Tile[];
  private readonly current: Uint8Array;
  private readonly seeds: Uint32Array;

  constructor(scene: Phaser.Scene, private readonly arena: Arena) {
    const { width, height, terrain } = arena;
    buildTileset(scene);
    const map = scene.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width, height });
    const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0)!;
    const layer = map.createBlankLayer("ground", tileset, 0, 0, width, height)!;
    const n = width * height;
    this.tiles = new Array(n);
    this.current = new Uint8Array(n);
    this.seeds = new Uint32Array(n);
    for (let i = 0; i < n; i++) {
      this.seeds[i] = hash(i);
      const idx = this.aliveIndex(i, terrain[i]!);
      this.current[i] = idx;
      this.tiles[i] = layer.putTileAt(idx, i % width, Math.floor(i / width))!;
    }
  }

  update(timeMs: number): void {
    const { arena, tiles, current, seeds } = this;
    const { terrain, fire } = arena;
    const frame = Math.floor(timeMs / FLAME_MS);
    for (let i = 0; i < tiles.length; i++) {
      const x = i % arena.width;
      const y = (i - x) / arena.width;
      const kind = terrain[i]!;
      const s = fire.states[i]!;
      let idx: number;
      if (fire.isFirebreak(x, y)) idx = TILE.firebreak;
      else if (s === 1) idx = TILE.burnBase + (kind === 0 ? 0 : kind === 3 ? 2 : 1) * FLAME_FRAMES + ((seeds[i]! + frame) % FLAME_FRAMES);
      else if (s === 2) idx = arena.hasSapling(x, y) ? TILE.sapling : kind === 3 ? TILE.charBush : kind > 0 ? TILE.charTree : TILE.ash[seeds[i]! % 4 === 0 ? 1 : 0]!;
      else idx = this.aliveIndex(i, kind);
      if (idx !== current[i]) {
        current[i] = idx;
        tiles[i]!.index = idx;
      }
    }
  }

  private aliveIndex(i: number, kind: number): number {
    if (kind === 1) return TILE.pine;
    if (kind === 2) return TILE.pineTall;
    if (kind === 3) return TILE.bush;
    return GRASS_VARIANTS[this.seeds[i]! % GRASS_VARIANTS.length]!;
  }
}