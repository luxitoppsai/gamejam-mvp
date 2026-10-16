import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";

const T = TILE_SIZE;
export const TILESET_KEY = "arena-tiles";
export const TOWN_KEY = "town";
export const DUNGEON_KEY = "dungeon";
export const FOUNTAIN_KEY = "fountain";
export const FLAME_FRAMES = 4;
const SRC_COLS = 12;

/** Frames de Kenney Tiny Town (referencia, CC0). */
const K = { GRASS: 0, BLADES: 1, FLOWERS: 2, PINE: 4, BUSH: 5, SPROUT: 17, PINE_TALL: 16, DIRT: 25 };

/** Índices del tileset compuesto. */
export const TILE = {
  grass: [0, 1, 2],
  pine: 3,
  pineTall: 4,
  bush: 5,
  burnBase: 10, // + familia * FLAME_FRAMES + frame; familia: 0 pasto, 1 pino, 2 arbusto
  ash: [22, 23],
  charBush: 24,
  charTree: 25,
  firebreak: 30,
  sapling: 31,
} as const;
const TOTAL = 32;

/** Variantes ponderadas de pasto. */
export const GRASS_VARIANTS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2];

const FLAME_OUTER = [0xe0, 0x30, 0x1c];
const FLAME_MID = [0xff, 0x8a, 0x1f];
const FLAME_CORE = [0xff, 0xd8, 0x4a];

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = T;
  return [c, c.getContext("2d")!];
}

/** Flama de 16x16 con contorno oscuro (misma técnica que la PoC 1; duplicada a propósito). */
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
  for (let pass = 0; pass < 2; pass++)
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) {
        if (!filled[y * T + x]) continue;
        const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => at(x + dx!, y + dy!) && depth[(y + dy!) * T + x + dx!]! >= pass);
        if (ok) depth[y * T + x] = pass + 1;
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

/** Pozo de agua de 16x16 (propio): anillo de piedra con contorno oscuro y agua azul. */
export function buildFountain(scene: Phaser.Scene): void {
  if (scene.textures.exists(FOUNTAIN_KEY)) return;
  const [c, ctx] = canvas();
  const disc = (r: number, color: string) => {
    ctx.fillStyle = color;
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) if ((x - 7.5) ** 2 + (y - 8.5) ** 2 <= r * r) ctx.fillRect(x, y, 1, 1);
  };
  disc(7.2, "#2b0f1f");
  disc(6.2, "#9aa0ad");
  disc(4.4, "#5d6270");
  disc(3.6, "#3aa0ff");
  ctx.fillStyle = "#a8dcff";
  ctx.fillRect(6, 7, 2, 1);
  ctx.fillRect(9, 9, 1, 1);
  scene.textures.addCanvas(FOUNTAIN_KEY, c);
}

/** Compone el tileset de la arena con tiles de Kenney (referencia) más llamas, ceniza, zanja y brote. */
export function buildTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TILESET_KEY)) return;
  const source = scene.textures.get(TOWN_KEY).getSourceImage() as CanvasImageSource;
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

  place(0, compose(K.GRASS));
  place(1, compose(K.BLADES));
  place(2, compose(K.FLOWERS));
  place(TILE.pine, compose(K.GRASS, K.PINE));
  place(TILE.pineTall, compose(K.GRASS, K.PINE_TALL));
  place(TILE.bush, compose(K.GRASS, K.BUSH));

  const ash = (specks: boolean): HTMLCanvasElement => {
    const c = tinted((ctx) => tile(ctx, K.DIRT), "rgba(36,32,40,0.9)");
    if (specks) {
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#575060";
      [[3, 4], [11, 9], [7, 12], [13, 3]].forEach(([x, y]) => ctx.fillRect(x!, y!, 1, 1));
    }
    return c;
  };
  const onAsh = (k: number, color: string): HTMLCanvasElement => {
    const [c, ctx] = canvas();
    ctx.drawImage(ash(false), 0, 0);
    ctx.drawImage(tinted((cc) => tile(cc, k), color), 0, 0);
    return c;
  };
  place(TILE.ash[0], ash(false));
  place(TILE.ash[1], ash(true));
  place(TILE.charBush, onAsh(K.BUSH, "rgba(30,24,30,0.86)"));
  place(TILE.charTree, onAsh(K.PINE, "rgba(30,24,30,0.86)"));

  const bases = [ash(false), onAsh(K.PINE, "rgba(110,30,0,0.55)"), onAsh(K.BUSH, "rgba(110,30,0,0.55)")];
  const flames = Array.from({ length: FLAME_FRAMES }, (_, f) => makeFlame(f));
  bases.forEach((base, fam) =>
    flames.forEach((flame, f) => {
      const [c, ctx] = canvas();
      ctx.drawImage(base, 0, 0);
      ctx.drawImage(flame, 0, 0);
      place(TILE.burnBase + fam * FLAME_FRAMES + f, c);
    }),
  );

  // Zanja: tierra con un surco oscuro en el centro.
  {
    const [c, ctx] = canvas();
    tile(ctx, K.DIRT);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(1, 4, 14, 8);
    ctx.fillStyle = "#3b2414";
    ctx.fillRect(2, 6, 12, 4);
    place(TILE.firebreak, c);
  }
  // Brote sobre ceniza.
  {
    const [c, ctx] = canvas();
    ctx.drawImage(ash(false), 0, 0);
    tile(ctx, K.SPROUT);
    place(TILE.sapling, c);
  }
  tex.refresh();
}