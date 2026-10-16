import type { PlayerCommand } from "./commands";

export interface GameStateSnapshot {
  tick: number;
  /** Checksum de la cuadrícula, para comprobar que los clientes coinciden. */
  gridChecksum: number;
  [key: string]: unknown;
}

/** PoC 3 es responsable. Todos los módulos del cliente hablan con la red por aquí. */
export interface NetSession {
  send(command: PlayerCommand): void;
  onState(listener: (state: GameStateSnapshot) => void): () => void;
}