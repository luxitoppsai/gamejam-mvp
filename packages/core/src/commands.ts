export type PlayerCommand =
  | { type: "extinguish"; x: number; y: number }
  | { type: "digFirebreak"; x: number; y: number }
  | { type: "plant"; x: number; y: number; species: string }
  | { type: "water"; x: number; y: number }
  | { type: "swapItem"; item: string | null }
  /** El Soporte pasa agua a otro jugador (Q9). */
  | { type: "transferWater"; toPlayer: number }
  /** El Soporte recarga su mochila en una fuente (Q9). */
  | { type: "refill" };