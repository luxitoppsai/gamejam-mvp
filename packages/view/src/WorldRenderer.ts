import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";
import { ALIVE_VARIANTS, BURNED_VARIANTS, buildTileset, FLAME_FRAMES, TILE, TILESET_KEY } from "./tileset";

/** Milisegundos por cuadro de la animación de llama. */
const FLAME_MS = 110;

const hash = (a: number): number => {
  let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

/** Lo mínimo que el renderer necesita saber del mundo (lo cumplen CellularFire y MockFireModel con un adaptador). */
export interface WorldView {
  readonly width: number;
  readonly height: number;
  /** 0 pastizal, 1 matorral, 2 bosque. */
  readonly vegetation: Uint8Array;
  /** 0 sin quemar, 1 ardiendo, 2 quemado. */
  readonly states: Uint8Array;
  /** 1 donde una celda quemada ya se regeneró (se dibuja como pasto con flores). Opcional. */
  readonly regrown?: Uint8Array;
  isFirebreak(x: number, y: number): boolean;
  /** Etapa del brote (0..2) o -1 si no hay. */
  saplingStage(x: number, y: number): number;
}

/**
 * Dibuja el mundo como un tilemap de 16x16 (pixel art): cada celda es un tile que cambia entre
 * vivo (pasto, arbusto, pino), ardiendo (llama animada), quemado (ceniza, troncos), zanja y brote.
 * Solo se toca un tile cuando su índice cambia. Añade humo y chispas con partículas.
 */
export class WorldRenderer {
  private readonly tiles: Phaser.Tilemaps.Tile[];
  private readonly current: Uint8Array;
  private readonly aliveIdx: Uint8Array;
  private readonly burnedIdx: Uint8Array;
  private readonly seeds: Uint32Array;
  private readonly burningIdx: Int32Array;
  private readonly smoke: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, private readonly world: WorldView) {
    const { width, height, vegetation } = world;
    buildTileset(scene);
    const map = scene.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width, height });
    const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0)!;
    const layer = map.createBlankLayer("world", tileset, 0, 0, width, height)!;

    const n = width * height;
    this.tiles = new Array(n);
    this.current = new Uint8Array(n);
    this.aliveIdx = new Uint8Array(n);
    this.burnedIdx = new Uint8Array(n);
    this.seeds = new Uint32Array(n);
    this.burningIdx = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      const h = hash(i);
      const veg = vegetation[i]!;
      this.seeds[i] = h;
      const av = ALIVE_VARIANTS[veg]!;
      const bv = BURNED_VARIANTS[veg]!;
      this.aliveIdx[i] = av[h % av.length]!;
      this.burnedIdx[i] = bv[(h >>> 8) % bv.length]!;
      this.current[i] = this.aliveIdx[i]!;
      this.tiles[i] = layer.putTileAt(this.aliveIdx[i]!, i % width, Math.floor(i / width))!;
    }

    if (!scene.textures.exists("px")) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2);
      g.generateTexture("px", 2, 2);
      g.destroy();
    }
    this.smoke = scene.add.particles(0, 0, "px", {
      lifespan: { min: 900, max: 1700 },
      speedY: { min: -26, max: -10 },
      speedX: { min: -4, max: 12 },
      scale: { start: 2, end: 5 },
      alpha: { start: 0.35, end: 0 },
      tint: [0x3a3438, 0x575057],
      emitting: false,
    });
    this.sparks = scene.add.particles(0, 0, "px", {
      lifespan: { min: 400, max: 900 },
      speedY: { min: -60, max: -25 },
      speedX: { min: -14, max: 14 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffd84a, 0xff8a1f],
      blendMode: "ADD",
      emitting: false,
    });
    this.smoke.setDepth(3);
    this.sparks.setDepth(4);
  }

  /** Actualiza los tiles que cambiaron y emite partículas. Devuelve cuántas celdas arden. */
  update(timeMs: number): number {
    const { world, tiles, current, aliveIdx, burnedIdx, seeds, burningIdx } = this;
    const { states, vegetation, width } = world;
    const frame = Math.floor(timeMs / FLAME_MS);
    let nBurning = 0;
    for (let i = 0; i < states.length; i++) {
      const s = states[i]!;
      const x = i % width;
      const y = (i - x) / width;
      let idx: number;
      if (world.isFirebreak(x, y)) idx = TILE.firebreak;
      else if (s === 0) idx = aliveIdx[i]!;
      else if (s === 1) {
        burningIdx[nBurning++] = i;
        idx = TILE.burningBase + vegetation[i]! * FLAME_FRAMES + ((seeds[i]! + frame) % FLAME_FRAMES);
      } else {
        const stage = world.saplingStage(x, y);
        if (stage >= 0) idx = TILE.sapling[stage]!;
        else if (world.regrown?.[i]) idx = TILE.grass[seeds[i]! % 4 === 0 ? 2 : seeds[i]! % 2]!;
        else idx = burnedIdx[i]!;
      }
      if (idx !== current[i]) {
        current[i] = idx;
        tiles[i]!.index = idx;
      }
    }

    const samples = Math.min(nBurning, 10);
    for (let n = 0; n < samples; n++) {
      const i = burningIdx[Math.floor(Math.random() * nBurning)]!;
      const px = (i % width) * TILE_SIZE + Math.random() * TILE_SIZE;
      const py = Math.floor(i / width) * TILE_SIZE;
      this.smoke.emitParticleAt(px, py + 2, 1);
      if (n < 4) this.sparks.emitParticleAt(px, py + 6, 1);
    }
    return nBurning;
  }
}
