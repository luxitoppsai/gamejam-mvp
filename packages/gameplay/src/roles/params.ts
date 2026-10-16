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
  /** Segundos por etapa de crecimiento de un brote (balance.md: 3 etapas x 20 s). */
  growthSeconds: 20,
  growthStages: 3,
  /** Velocidad del dron en px/s (más rápido que un jugador). */
  droneSpeed: 90,
  /** Distancia máxima del dron al Vigía en px (40 tiles). */
  droneLeash: 640,
  /** Batería que recupera el dron en tierra por segundo. */
  droneRecharge: 0.6,
  /** Segundos que dura una marca de zona de riesgo y máximo de marcas simultáneas. */
  markerSeconds: 90,
  maxMarkers: 6,
  /** Frecuencia máxima (Hz) de comandos repetitivos (extinguish). */
  commandHz: 10,
} as const;