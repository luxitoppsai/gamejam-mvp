import { TILE_SIZE } from "@vov/core";

const T = TILE_SIZE;
const FLAME_OUTER = [0xe0, 0x30, 0x1c];
const FLAME_MID = [0xff, 0x8a, 0x1f];
const FLAME_CORE = [0xff, 0xd8, 0x4a];
const OUTLINE = [0x2b, 0x0f, 0x1f];

export function tileCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = T;
  return [c, c.getContext("2d")!];
}

/** Llama de 16x16 con contorno oscuro (estilo 16 bits). Procedural: 3 lenguas que oscilan por cuadro. */
export function makeFlame(frame: number): HTMLCanvasElement {
  const [c, ctx] = tileCanvas();
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
      else if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1)) put(i, OUTLINE);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
