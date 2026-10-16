/** Valores iniciales de specs/balance.md (nivel MVP). Ajustar allí y aquí a la vez. */
export const MATCH = {
  /** Lado del mapa en celdas. */
  mapSize: 128,
  /** Fracción quemada que provoca la derrota. */
  loseFraction: 0.7,
  /** Velocidad del fuego respecto a la de la PoC 1 (frente ~2/1.2/0.55 celdas/s a 1.0): al encenderse y tras la rampa. */
  fireSpeedStart: 0.06,
  fireSpeedEnd: 0.3,
  /** Segundos de incendio hasta alcanzar la velocidad máxima. */
  fireRampSeconds: 300,
  /** Multiplicador de la potencia de extinción de las herramientas. */
  extinguishScale: 5,
  /** Posición horizontal de los focos como fracción del ancho del mapa (la base está a la izquierda). */
  igniteFrom: 0.45,
  igniteTo: 0.6,
  /** Focos iniciales del incendio. */
  foci: 1,
  /** Radio de visión (celdas) de cada jugador, del dron y de la base; el equipo solo ve el fuego dentro de ellos. */
  playerVision: 8,
  droneVision: 12,
  baseVision: 11,
  /** Cada cuántos segundos la radio actualiza su reporte del foco principal. */
  radioSeconds: 6,
  /** Duración de la preparación en segundos. */
  prepSeconds: 45,
  /** Ventana de reforestación en segundos. */
  reforestSeconds: 300,
  /** Fracción de las celdas quemadas que debe regenerarse para ganar. */
  regenGoal: 0.5,
} as const;
