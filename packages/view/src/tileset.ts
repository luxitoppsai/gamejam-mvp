import Phaser from "phaser";
import { TILE_SIZE } from "@vov/core";
import { makeFlame, tileCanvas } from "./flame";

const T = TILE_SIZE;
export const TILESET_KEY = "vov-tiles";
/** Claves de textura que cada app carga (Kenney Tiny Town / Tiny Dungeon, CC0, solo referencia). */
export const TOWN_KEY = "town";
export const DUNGEON_KEY = "dungeon";
export const FOUNTAIN_KEY = "fountain";
export const DRONE_KEY = "drone";
export const FLAME_FRAMES = 4;
const SRC_COLS = 12;

/** Frames de Kenney Tiny Town (referencia). */
const K = { GRASS: 0, BLADES: 1, FLOWERS: 2, PINE: 4, BUSH: 5, SPROUT: 17, PINE_TALL: 16, PINE_SMALL: 28, DIRT: 25 };

/** Índices del tileset compuesto (una fila de tiles de 16x16). */
export const TILE = {
  grass: [0, 1, 2],
  bush: [3, 4],
  forest: [5, 6, 7],
  burningBase: 10, // + vegetación * FLAME_FRAMES + cuadro; vegetación: 0 pasto, 1 matorral, 2 bosque
  ash: [22, 23],
  charBush: 24,
  charTree: [25, 26],
  firebreak: 27,
  sapling: [28, 29, 30], // brote, joven, adulto
} as const;
const TOTAL = 31;

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

/** Pozo de agua de 16x16 (propio): anillo de piedra con contorno oscuro y agua azul. */
export function buildFountain(scene: Phaser.Scene): void {
  if (scene.textures.exists(FOUNTAIN_KEY)) return;
  const [c, ctx] = tileCanvas();
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

/** Dron de 16x16 (propio): cuerpo oscuro, cuatro rotores claros y un led rojo. */
export function buildDrone(scene: Phaser.Scene): void {
  if (scene.textures.exists(DRONE_KEY)) return;
  const [c, ctx] = tileCanvas();
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  px(4, 4, 8, 8, "#2b0f1f"); // contorno de los brazos
  px(1, 1, 5, 5, "#2b0f1f");
  px(10, 1, 5, 5, "#2b0f1f");
  px(1, 10, 5, 5, "#2b0f1f");
  px(10, 10, 5, 5, "#2b0f1f");
  px(2, 2, 3, 3, "#cfe8ff"); // rotores
  px(11, 2, 3, 3, "#cfe8ff");
  px(2, 11, 3, 3, "#cfe8ff");
  px(11, 11, 3, 3, "#cfe8ff");
  px(5, 5, 6, 6, "#5d6270"); // cuerpo
  px(6, 6, 4, 4, "#8a92a3");
  px(7, 7, 2, 2, "#ff4a3a"); // led
  scene.textures.addCanvas(DRONE_KEY, c);
}

/**
 * Compone el tileset del mundo a partir de tiles de Kenney (referencia) más llamas, ceniza, zanja
 * y brotes propios. Requiere que la escena haya cargado TOWN_KEY (imagen o spritesheet de 12 columnas).
 */
export function buildTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TILESET_KEY)) return;
  const source = scene.textures.get(TOWN_KEY).getSourceImage() as CanvasImageSource;
  const tex = scene.textures.createCanvas(TILESET_KEY, T * TOTAL, T);
  if (!tex) throw new Error("no se pudo crear el tileset");
  const out = tex.getContext();

  const tile = (ctx: CanvasRenderingContext2D, k: number) =>
    ctx.drawImage(source, (k % SRC_COLS) * T, Math.floor(k / SRC_COLS) * T, T, T, 0, 0, T, T);
  const tinted = (draw: (c: CanvasRenderingContext2D) => void, color: string): HTMLCanvasElement => {
    const [c, ctx] = tileCanvas();
    draw(ctx);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, T, T);
    return c;
  };
  const place = (idx: number, c: CanvasImageSource) => out.drawImage(c, idx * T, 0);
  const compose = (...layers: number[]): HTMLCanvasElement => {
    const [c, ctx] = tileCanvas();
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
    const [c, ctx] = tileCanvas();
    ctx.drawImage(ashGround(false), 0, 0);
    ctx.drawImage(tinted((cc) => tile(cc, k), color), 0, 0);
    return c;
  };
  place(24, onAsh(K.BUSH, "rgba(30,24,30,0.86)"));
  place(25, onAsh(K.PINE, "rgba(30,24,30,0.86)"));
  place(26, onAsh(K.PINE_SMALL, "rgba(30,24,30,0.86)"));

  // Ardiendo: base según vegetación + 4 cuadros de llama
  const bases = [ashGround(false), onAsh(K.BUSH, "rgba(110,30,0,0.55)"), onAsh(K.PINE, "rgba(110,30,0,0.55)")];
  const flames = Array.from({ length: FLAME_FRAMES }, (_, f) => makeFlame(f));
  bases.forEach((base, veg) =>
    flames.forEach((flame, f) => {
      const [c, ctx] = tileCanvas();
      ctx.drawImage(base, 0, 0);
      ctx.drawImage(flame, 0, 0);
      place(TILE.burningBase + veg * FLAME_FRAMES + f, c);
    }),
  );

  // Zanja: tierra con un surco oscuro en el centro.
  {
    const [c, ctx] = tileCanvas();
    tile(ctx, K.DIRT);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(1, 4, 14, 8);
    ctx.fillStyle = "#3b2414";
    ctx.fillRect(2, 6, 12, 4);
    place(TILE.firebreak, c);
  }
  // Crecimiento: brote sobre ceniza -> arbusto joven -> árbol adulto sobre pasto (recompensa visible).
  {
    const [a, actx] = tileCanvas();
    actx.drawImage(ashGround(false), 0, 0);
    tile(actx, K.SPROUT);
    place(TILE.sapling[0], a);
    const [b, bctx] = tileCanvas();
    bctx.drawImage(ashGround(false), 0, 0);
    tile(bctx, K.BUSH);
    place(TILE.sapling[1], b);
    place(TILE.sapling[2], compose(K.GRASS, K.PINE));
  }
  tex.refresh();
}
