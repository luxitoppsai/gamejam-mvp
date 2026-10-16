/** PRNG determinista (mulberry32). Devuelve floats en [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a de 32 bits sobre varios arrays de bytes (checksum de la cuadrícula). */
export function fnv1a(...parts: Uint8Array[]): number {
  let h = 0x811c9dc5;
  for (const arr of parts) {
    for (let i = 0; i < arr.length; i++) {
      h ^= arr[i]!;
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}