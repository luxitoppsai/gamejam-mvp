export type Vegetation = "grass" | "shrub" | "forest";
export type CellFireState = "unburned" | "burning" | "burned";

export interface FireCell {
  state: CellFireState;
  vegetation: Vegetation;
}

export interface Wind {
  /** Dirección en radianes. */
  direction: number;
  /** 0..1 */
  strength: number;
}

/** PoC 1 es responsable. Lógica pura y determinista (misma semilla = mismo resultado). */
export interface FireModel {
  step(dt: number): void;
  getCell(x: number, y: number): FireCell;
  ignite(x: number, y: number): void;
  extinguish(x: number, y: number, amount: number): void;
  setWind(direction: number, strength: number): void;
  /** Marca/desmarca una celda como cortafuego: no arde ni contagia (Q8). */
  setFirebreak(x: number, y: number, on: boolean): void;
  isFirebreak(x: number, y: number): boolean;
}