/** Valores iniciales de specs/balance.md (sección PoC 2). */
export const PARAMS = {
  /** Velocidad del jugador en px/s (3.75 tiles/s). */
  playerSpeed: 60,
  /** Mitad del lado de la caja de colisión en px. */
  playerHalf: 5,
  /** Distancia máxima en px para tomar un ítem del suelo. */
  interactRange: 16,
  /** Distancia máxima en px para que el Soporte recargue a otro jugador. */
  supportRange: 24,
  /** Distancia máxima en px a una fuente para recargar la mochila. */
  fountainRange: 22,
  /** Agua/s que pasa del Soporte al Sofocador. */
  transferRate: 40,
  /** Agua/s que recarga la mochila en una fuente. */
  fountainRate: 25,
  /** Segundos por celda de zanja. */
  digSeconds: 1.5,
  /** Segundos por siembra. */
  plantSeconds: 0.6,
  /** Frecuencia máxima (Hz) de comandos repetitivos (extinguish). */
  commandHz: 10,
} as const;