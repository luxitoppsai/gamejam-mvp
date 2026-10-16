export type TerrainState = "alive" | "burned" | "regenerated";

export interface TerrainChange {
  x: number;
  y: number;
  state: TerrainState;
}

/** PoC 4 es responsable. El fuego escribe "burned"; la reforestación escribe "regenerated". */
export interface TerrainGrid {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): TerrainState;
  set(x: number, y: number, state: TerrainState): void;
  onChange(listener: (change: TerrainChange) => void): () => void;
}