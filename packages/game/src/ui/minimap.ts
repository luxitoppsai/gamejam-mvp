import { TILE_SIZE } from "@vov/core";
import type { Match } from "@vov/gameplay";

const RGB = {
  grass: [96, 168, 80],
  shrub: [70, 140, 70],
  forest: [40, 106, 56],
  burning: [255, 140, 30],
  burned: [52, 46, 58],
  regrown: [150, 230, 110],
  firebreak: [140, 90, 50],
} as const;
const VEG = [RGB.grass, RGB.shrub, RGB.forest] as const;

/** Dibuja el minimapa (1 píxel por celda, el CSS lo escala) y los jugadores como puntos. */
export function drawMinimap(canvas: HTMLCanvasElement, match: Match): void {
  const s = match.size;
  if (canvas.width !== s) canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(s, s);
  const { states, vegetation } = match.fire;
  for (let i = 0; i < s * s; i++) {
    const st = states[i]!;
    const x = i % s;
    const y = (i - x) / s;
    const c = match.fire.isFirebreak(x, y)
      ? RGB.firebreak
      : st === 1
        ? RGB.burning
        : st === 2
          ? match.regrown[i]
            ? RGB.regrown
            : RGB.burned
          : VEG[vegetation[i]!]!;
    img.data[i * 4] = c[0];
    img.data[i * 4 + 1] = c[1];
    img.data[i * 4 + 2] = c[2];
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = "#fff";
  for (const p of match.arena.players) ctx.fillRect(Math.floor(p.x / TILE_SIZE) - 1, Math.floor(p.y / TILE_SIZE) - 1, 3, 3);
}
