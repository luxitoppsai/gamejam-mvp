import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";
import type { CellularFire } from "../sim";
import { BURNING, UNBURNED } from "../sim";

const abgr = (hex: number): number => {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
};

/** Vegetación viva: [pastizal, matorral, bosque], dos tonos para dar textura. */
const LIVE = [
  [abgr(0xa7c957), abgr(0x98b84a)],
  [abgr(0x5aa02c), abgr(0x4f9126)],
  [abgr(0x24703a), abgr(0x1d6032)],
];
const FLAME = [abgr(0xffd23f), abgr(0xff9a1f), abgr(0xff5a1f), abgr(0xd62b1b)];
const FLAME_LOW = [abgr(0xd62b1b), abgr(0x9c1f14)];
const ASH = [abgr(0x2b2b31), abgr(0x34343b), abgr(0x3d3d45)];
const EMBER = abgr(0xb0391f);

const hash = (a: number, b: number): number => {
  let h = (Math.imul(a, 2654435761) ^ Math.imul(b, 40503)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return h >>> 0;
};

/**
 * Dibuja la cuadrícula como una textura de 1 px por celda escalada a un tile de 16 px
 * (pixelArt => sin suavizado), más partículas de llama y humo sobre celdas ardiendo.
 */
export class FireRenderer {
  readonly image: Phaser.GameObjects.Image;
  private readonly canvas: Phaser.Textures.CanvasTexture;
  private readonly imageData: ImageData;
  private readonly pixels: Uint32Array;
  private readonly burningIdx: Int32Array;
  private readonly flames: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly smoke: Phaser.GameObjects.Particles.ParticleEmitter;
  private frame = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly fire: CellularFire) {
    const { width, height } = fire;
    const key = "fire-map";
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, width, height);
    if (!tex) throw new Error("no se pudo crear la textura del mapa");
    this.canvas = tex;
    this.imageData = tex.context.createImageData(width, height);
    this.pixels = new Uint32Array(this.imageData.data.buffer);
    this.burningIdx = new Int32Array(width * height);
    this.image = scene.add.image(0, 0, key).setOrigin(0, 0).setScale(TILE_SIZE);

    if (!scene.textures.exists("px")) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 3, 3);
      g.generateTexture("px", 3, 3);
      g.destroy();
    }
    this.flames = scene.add.particles(0, 0, "px", {
      lifespan: { min: 300, max: 700 },
      speedY: { min: -40, max: -15 },
      speedX: { min: -8, max: 8 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0xffd23f, 0xff8c1a, 0xff4a1f],
      blendMode: "ADD",
      emitting: false,
    });
    this.smoke = scene.add.particles(0, 0, "px", {
      lifespan: { min: 900, max: 1600 },
      speedY: { min: -22, max: -8 },
      speedX: { min: -6, max: 10 },
      scale: { start: 1.2, end: 3 },
      alpha: { start: 0.25, end: 0 },
      tint: [0x555555, 0x777777],
      emitting: false,
    });
    this.flames.setDepth(2);
    this.smoke.setDepth(3);
  }

  /** Redibuja toda la cuadrícula y emite partículas. Devuelve cuántas celdas arden. */
  update(): number {
    const { fire, pixels, burningIdx } = this;
    const { states, vegetation, burnLeft, width } = fire;
    const f = this.frame++;
    const ff = f >> 1; // la llama cambia cada 2 cuadros
    let nBurning = 0;
    for (let i = 0; i < states.length; i++) {
      const s = states[i]!;
      if (s === UNBURNED) {
        pixels[i] = LIVE[vegetation[i]!]![(i + (i / width | 0)) & 1]!;
      } else if (s === BURNING) {
        burningIdx[nBurning++] = i;
        const h = hash(i, ff);
        pixels[i] = burnLeft[i]! <= 3 ? FLAME_LOW[h & 1]! : FLAME[h & 3]!;
      } else {
        const h = hash(i, 7);
        pixels[i] = h % 211 === 0 && (f & 16) === 0 ? EMBER : ASH[h % 3]!;
      }
    }
    this.canvas.context.putImageData(this.imageData, 0, 0);
    this.canvas.refresh();

    const samples = Math.min(nBurning, 24);
    for (let n = 0; n < samples; n++) {
      const i = burningIdx[Math.floor(Math.random() * nBurning)]!;
      const px = (i % width) * TILE_SIZE + Math.random() * TILE_SIZE;
      const py = Math.floor(i / width) * TILE_SIZE + Math.random() * TILE_SIZE;
      this.flames.emitParticleAt(px, py, 1);
      if ((n & 1) === 0) this.smoke.emitParticleAt(px, py - 4, 1);
    }
    return nBurning;
  }
}