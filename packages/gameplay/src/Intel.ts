/** Lo último que el equipo sabe de una celda: 0 sin datos, 1 sin quemar, 2 ardiendo, 3 quemada. */
export type Known = 0 | 1 | 2 | 3;

export interface VisionSource {
  /** Posición en celdas. */
  x: number;
  y: number;
  /** Radio en celdas. */
  r: number;
}

/**
 * Información del equipo sobre el incendio ("niebla" del fuego). El terreno siempre se conoce, pero
 * el estado del fuego solo se actualiza donde hay ojos: jugadores, base y dron del Vigía.
 * Lo no visto conserva el último dato (obsoleto) en `known`. Lógica pura y determinista.
 */
export class Intel {
  /** Último estado conocido por celda. */
  readonly known: Uint8Array;
  /** Segundos de partida en que se vio por última vez cada celda. */
  readonly seenAt: Float32Array;
  /** 1 si la celda está a la vista ahora mismo. */
  readonly live: Uint8Array;
  private readonly discs = new Map<number, [number, number][]>();

  constructor(readonly width: number, readonly height: number) {
    const n = width * height;
    this.known = new Uint8Array(n);
    this.seenAt = new Float32Array(n);
    this.live = new Uint8Array(n);
  }

  /** Refresca lo visible desde las fuentes dadas leyendo los estados reales (0/1/2) del fuego. */
  update(now: number, sources: readonly VisionSource[], states: Uint8Array): void {
    const { width: w, height: h, known, seenAt, live } = this;
    live.fill(0);
    for (const s of sources) {
      const cx = Math.floor(s.x);
      const cy = Math.floor(s.y);
      for (const [dx, dy] of this.disc(s.r)) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        known[i] = (states[i]! + 1) as Known;
        seenAt[i] = now;
        live[i] = 1;
      }
    }
  }

  /** Cuántos segundos hace que se vio la celda (Infinity si nunca). */
  age(i: number, now: number): number {
    return this.known[i] === 0 ? Infinity : now - this.seenAt[i]!;
  }

  private disc(r: number): [number, number][] {
    let d = this.discs.get(r);
    if (!d) {
      d = [];
      const ri = Math.ceil(r);
      for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) if (dx * dx + dy * dy <= r * r) d.push([dx, dy]);
      this.discs.set(r, d);
    }
    return d;
  }
}
