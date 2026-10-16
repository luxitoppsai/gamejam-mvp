export type PlayerCommand =
  | { type: "extinguish"; x: number; y: number }
  | { type: "digFirebreak"; x: number; y: number }
  | { type: "plant"; x: number; y: number; species: string }
  | { type: "water"; x: number; y: number }
  | { type: "swapItem"; item: string | null };