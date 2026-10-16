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
/** Brillo del fuego que ya no está a la vista (dato obsoleto). */
const STALE = 0.5;

/**
 * Minimapa de lo que el equipo SABE: el terreno siempre se ve, pero el fuego solo donde hay ojos
 * (jugadores, base, dron). Lo visto antes queda atenuado. Encima: marcas, zona de la radio, dron y jugadores.
 */
export function drawMinimap(canvas: HTMLCanvasElement, match: Match): void {
  const s = match.size;
  if (canvas.width !== s) canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(s, s);
  const { known, live } = match.intel;
  const { vegetation } = match.fire;
  for (let i = 0; i < s * s; i++) {
    const x = i % s;
    const y = (i - x) / s;
    const k = known[i]!;
    let c: readonly number[] = VEG[vegetation[i]!]!;
    let k2 = 1;
    if (k === 2) {
      c = RGB.burning;
      k2 = live[i] ? 1 : STALE;
    } else if (k === 3) {
      c = match.regrown[i] ? RGB.regrown : RGB.burned;
    }
    if (match.fire.isFirebreak(x, y)) c = RGB.firebreak;
    img.data[i * 4] = c[0]! * k2;
    img.data[i * 4 + 1] = c[1]! * k2;
    img.data[i * 4 + 2] = c[2]! * k2;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const r = match.radioActive ? match.radio : null;
  if (r) {
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x + 0.5, r.y + 0.5, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#ff3a2a";
  for (const m of match.arena.markers) ctx.fillRect(m.x - 2, m.y - 2, 5, 5);
  for (const p of match.arena.players) {
    if (p.drone.active) {
      ctx.fillStyle = "#7fd4ff";
      ctx.fillRect(Math.floor(p.drone.x / TILE_SIZE) - 2, Math.floor(p.drone.y / TILE_SIZE) - 2, 5, 5);
    }
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.floor(p.x / TILE_SIZE) - 1, Math.floor(p.y / TILE_SIZE) - 1, 3, 3);
  }
}
