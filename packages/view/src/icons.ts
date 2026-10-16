import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";
import { tileCanvas } from "./flame";

const T = TILE_SIZE;
const OUTLINE = [0x2b, 0x0f, 0x1f];

type Ctx = CanvasRenderingContext2D;
type Draw = (r: (x: number, y: number, w: number, h: number, color: string) => void, p: (x: number, y: number, color: string) => void) => void;

/** Iconos de ítems de 16x16 (propios): se dibujan en una cuadrícula de 12x12 y se les añade contorno oscuro. */
const ICONS: Record<string, Draw> = {
  hose: (r, p) => {
    // Rollo de manguera: anillo rojo con boquilla amarilla.
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 12; x++) {
        const d = Math.hypot(x - 4.5, y - 6.5);
        if (d <= 4.6 && d >= 2.2) p(x, y, d > 3.6 ? "#a82418" : "#e8442e");
      }
    r(4, 3, 2, 1, "#ff9a86");
    r(8, 5, 3, 3, "#8a92a3");
    r(10, 4, 2, 5, "#ffd23f");
  },
  extinguisher: (r) => {
    r(3, 3, 6, 9, "#d83a2a");
    r(3, 3, 2, 9, "#ff6a52");
    r(3, 6, 6, 2, "#f2f2f2");
    r(4, 1, 4, 2, "#5d6270");
    r(8, 2, 3, 1, "#5d6270");
    r(10, 3, 1, 2, "#2b2b33");
  },
  backpack: (r) => {
    r(2, 2, 8, 10, "#3a8fe0");
    r(2, 2, 3, 10, "#6ab6ff");
    r(0, 4, 2, 6, "#8a5a2b");
    r(10, 4, 2, 6, "#8a5a2b");
    r(4, 0, 4, 2, "#5d6270");
    // gota de agua
    r(5, 5, 2, 1, "#ffffff");
    r(4, 6, 4, 3, "#ffffff");
    r(5, 9, 2, 1, "#ffffff");
  },
  shovel: (r, p) => {
    for (let i = 0; i < 9; i++) {
      p(1 + i, 10 - i, "#8a5a2b");
      p(2 + i, 10 - i, "#b07a3e");
    }
    r(7, 0, 5, 5, "#aab2c0");
    r(8, 1, 3, 3, "#d6dce8");
  },
  seeds: (r) => {
    r(2, 5, 8, 7, "#c8964a");
    r(2, 5, 3, 7, "#e4b86a");
    r(3, 4, 6, 1, "#ffd23f");
    r(5, 1, 2, 3, "#3fbf4a");
    r(3, 1, 2, 2, "#7fe05a");
    r(7, 2, 2, 2, "#7fe05a");
    r(5, 7, 2, 3, "#6b4a1e");
  },
  radio: (r) => {
    r(2, 4, 8, 8, "#5d6270");
    r(2, 4, 8, 2, "#8a92a3");
    r(8, 0, 1, 4, "#2b2b33");
    r(3, 6, 4, 3, "#7fe05a");
    r(3, 6, 4, 1, "#c8ffb0");
    r(8, 7, 2, 2, "#ffd23f");
    r(3, 10, 6, 1, "#2b2b33");
  },
};

export const iconKey = (kind: string): string => `item-${kind}`;

function outline(c: HTMLCanvasElement): void {
  const ctx = c.getContext("2d")!;
  const img = ctx.getImageData(0, 0, T, T);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < T && y < T && img.data[(y * T + x) * 4 + 3]! > 0;
  const out: number[] = [];
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) out.push(y * T + x);
    }
  for (const i of out) {
    img.data[i * 4] = OUTLINE[0]!;
    img.data[i * 4 + 1] = OUTLINE[1]!;
    img.data[i * 4 + 2] = OUTLINE[2]!;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Crea una textura `item-<tipo>` por cada ícono propio (la cuadrícula de 12x12 se centra con margen de 2 px). */
export function buildItemIcons(scene: Phaser.Scene): void {
  for (const [kind, draw] of Object.entries(ICONS)) {
    const key = iconKey(kind);
    if (scene.textures.exists(key)) continue;
    const [c, ctx] = tileCanvas();
    const r = (x: number, y: number, w: number, h: number, color: string) => {
      (ctx as Ctx).fillStyle = color;
      (ctx as Ctx).fillRect(2 + x, 2 + y, w, h);
    };
    const p = (x: number, y: number, color: string) => r(x, y, 1, 1, color);
    draw(r, p);
    outline(c);
    scene.textures.addCanvas(key, c);
  }
}
