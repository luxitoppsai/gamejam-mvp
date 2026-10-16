import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";

const T = TILE_SIZE;
export const TILESET_KEY = "fire-tiles";
export const SOURCE_KEY = "kenney-town";
export const FLAME_FRAMES = 4;

/** Índices en tilemap_packed.png de Kenney Tiny Town (12 columnas, CC0). Solo referencia. */
const K = { GRASS: 0, BLADES: 1, FLOWERS: 2, PINE: 4, BUSH: 5, PINE_TALL: 16, PINE_SMALL: 28, DIRT: 25 };
const SRC_COLS = 12;

/** Índices del tileset compuesto (una fila de tiles de 16x16). */
export const TILE = {
  grass: [0, 1, 2],
  bush: [3, 4],
  forest: [5, 6, 7],
  burningBase: 10, // + veg * FLAME_FRAMES + frame
  ash: [22, 23],
  charBush: 24,
  charTree: [25, 26],
} as const;
const TOTAL = 27;

/** Variantes ponderadas por vegetación (0 pastizal, 1 matorral, 2 bosque) para el aspecto vivo. */
export const ALIVE_VARIANTS: readonly (readonly number[])[] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2],
  [3, 3, 4],
  [5, 5, 6, 7],
];
export const BURNED_VARIANTS: readonly (readonly number[])[] = [
  [22, 22, 22, 23],
  [24],
  [25, 25, 26],
];

const DARK = "#2b0f1f";
const FLAME_OUTER = [0xe0, 0x30, 0x1c];
const FLAME_MID = [0xff, 0x8a, 0x1f];
const FLAME_CORE = [0xff, 0xd8, 0x4a];

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = T;
  return [c, c.getContext("2d")!];
}

/** Flama de 16x16 con contorno oscuro (estilo 16 bits). Procedural: 3 lenguas que oscilan por cuadro. */
function makeFlame(frame: number): HTMLCanvasElement {
  const [c, ctx] = canvas();
  const filled = new Uint8Array(T * T);
  const peaks = [4.5, 8, 11.5];
  for (let x = 2; x <= 13; x++) {
    let h = 4;
    peaks.forEach((cx, k) => {
      const amp = 6 + 5 * (0.5 + 0.5 * Math.sin(frame * 1.57 + k * 2.1)) + (k === 1 ? 2 : 0);
      h = Math.max(h, amp * Math.max(0, 1 - Math.abs(x - cx) / 3.8));
    });
    for (let y = Math.max(1, 15 - Math.round(h)); y <= 14; y++) filled[y * T + x] = 1;
  }
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= T || y >= T ? 0 : filled[y * T + x]!);
  const depth = new Uint8Array(T * T);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) {
        if (!filled[y * T + x]) continue;
        const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => at(x + dx!, y + dy!) && depth[(y + dy!) * T + x + dx!]! >= pass);
        if (ok) depth[y * T + x] = pass + 1;
      }
  }
  const img = ctx.createImageData(T, T);
  const put = (i: number, rgb: number[]) => {
    img.data[i * 4] = rgb[0]!;
    img.data[i * 4 + 1] = rgb[1]!;
    img.data[i * 4 + 2] = rgb[2]!;
    img.data[i * 4 + 3] = 255;
  };
  for (let y = 0; y < T; y++)
    for (let x = 0; x < T; x++) {
      const i = y * T + x;
      if (filled[i]) put(i, depth[i] === 0 ? FLAME_OUTER : depth[i] === 1 ? FLAME_MID : FLAME_CORE);
      else if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1)) put(i, [0x2b, 0x0f, 0x1f]);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Compone el tileset del fuego a partir de tiles de Kenney (referencia) más llamas y ceniza propias:
 * vivo (pasto/arbusto/pino), ardiendo (4 cuadros de llama por vegetación) y quemado (ceniza/troncos).
 */
export function buildTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TILESET_KEY)) return;
  const source = scene.textures.get(SOURCE_KEY).getSourceImage() as CanvasImageSource;
  const tex = scene.textures.createCanvas(TILESET_KEY, T * TOTAL, T);
  if (!tex) throw new Error("no se pudo crear el tileset");
  const out = tex.getContext();

  const tile = (ctx: CanvasRenderingContext2D, k: number) =>
    ctx.drawImage(source, (k % SRC_COLS) * T, Math.floor(k / SRC_COLS) * T, T, T, 0, 0, T, T);
  const tinted = (draw: (c: CanvasRenderingContext2D) => void, color: string): HTMLCanvasElement => {
    const [c, ctx] = canvas();
    draw(ctx);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, T, T);
    return c;
  };
  const place = (idx: number, c: CanvasImageSource) => out.drawImage(c, idx * T, 0);
  const compose = (...layers: number[]): HTMLCanvasElement => {
    const [c, ctx] = canvas();
    layers.forEach((k) => tile(ctx, k));
    return c;
  };

  // Vivo
  place(0, compose(K.GRASS));
  place(1, compose(K.BLADES));
  place(2, compose(K.FLOWERS));
  place(3, compose(K.GRASS, K.BUSH));
  place(4, compose(K.BLADES, K.BUSH));
  place(5, compose(K.GRASS, K.PINE));
  place(6, compose(K.BLADES, K.PINE_SMALL));
  place(7, compose(K.GRASS, K.PINE_TALL));

  // Ceniza y restos
  const ashGround = (specks: boolean): HTMLCanvasElement => {
    const c = tinted((ctx) => tile(ctx, K.DIRT), "rgba(36,32,40,0.9)");
    if (specks) {
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#575060";
      [[3, 4], [11, 9], [7, 12], [13, 3]].forEach(([x, y]) => ctx.fillRect(x!, y!, 1, 1));
    }
    return c;
  };
  place(22, ashGround(false));
  place(23, ashGround(true));
  const onAsh = (k: number, color: string): HTMLCanvasElement => {
    const [c, ctx] = canvas();
    ctx.drawImage(ashGround(false), 0, 0);
    ctx.drawImage(tinted((cc) => tile(cc, k), color), 0, 0);
    return c;
  };
  place(24, onAsh(K.BUSH, "rgba(30,24,30,0.86)"));
  place(25, onAsh(K.PINE, "rgba(30,24,30,0.86)"));
  place(26, onAsh(K.PINE_SMALL, "rgba(30,24,30,0.86)"));

  // Ardiendo: base según vegetación + 4 cuadros de llama
  const bases = [
    ashGround(false),
    onAsh(K.BUSH, "rgba(110,30,0,0.55)"),
    onAsh(K.PINE, "rgba(110,30,0,0.55)"),
  ];
  const flames = Array.from({ length: FLAME_FRAMES }, (_, f) => makeFlame(f));
  bases.forEach((base, veg) =>
    flames.forEach((flame, f) => {
      const [c, ctx] = canvas();
      ctx.drawImage(base, 0, 0);
      ctx.drawImage(flame, 0, 0);
      place(TILE.burningBase + veg * FLAME_FRAMES + f, c);
    }),
  );
  tex.refresh();
}