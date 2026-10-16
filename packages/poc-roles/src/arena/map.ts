/** 0 pasto libre, 1 pino, 2 pino alto, 3 arbusto. Los >0 son obstáculos mientras no se quemen. */
export function generateTerrain(
  width: number,
  height: number,
  seed: number,
  isClear: (x: number, y: number) => boolean,
): Uint8Array {
  let a = (seed ^ 0x2545f491) >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const cell = 5;
  const gw = Math.ceil(width / cell) + 2;
  const gh = Math.ceil(height / cell) + 2;
  const grid = Array.from({ length: gw * gh }, () => rng());
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isClear(x, y)) continue;
      const fx = x / cell;
      const fy = y / cell;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = smooth(fx - ix);
      const ty = smooth(fy - iy);
      const g = (gx: number, gy: number) => grid[gy * gw + gx]!;
      const v = (g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx) * (1 - ty) + (g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx) * ty;
      if (v < 0.58) continue;
      const r = rng();
      out[y * width + x] = r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
    }
  }
  return out;
}