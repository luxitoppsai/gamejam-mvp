import { FOREST, GRASS, SHRUB } from "./params";
import { mulberry32 } from "./rng";

/** Mapa de vegetación determinista a partir de ruido de valor suavizado. */
export function generateVegetation(width: number, height: number, seed: number, cell = 8): Uint8Array {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const gw = Math.ceil(width / cell) + 2;
  const gh = Math.ceil(height / cell) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();

  const smooth = (t: number) => t * t * (3 - 2 * t);
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const fx = x / cell;
      const fy = y / cell;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = smooth(fx - ix);
      const ty = smooth(fy - iy);
      const a = grid[iy * gw + ix]!;
      const b = grid[iy * gw + ix + 1]!;
      const c = grid[(iy + 1) * gw + ix]!;
      const d = grid[(iy + 1) * gw + ix + 1]!;
      const v = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
      out[y * width + x] = v < 0.38 ? GRASS : v < 0.68 ? SHRUB : FOREST;
    }
  }
  return out;
}

export function uniformVegetation(width: number, height: number, kind: number): Uint8Array {
  return new Uint8Array(width * height).fill(kind);
}