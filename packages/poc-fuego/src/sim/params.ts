import { DEFAULT_SEED } from "@vov/core";

/** Valores iniciales de specs/balance.md. Ajustar allí y aquí a la vez. */
export { DEFAULT_SEED };

/** Duración de un paso de simulación en segundos (10 pasos/s). */
export const STEP_SECONDS = 0.1;
/** Máximo de pasos que se recuperan en una sola llamada a step(). */
export const MAX_CATCHUP_STEPS = 5;

export const UNBURNED = 0;
export const BURNING = 1;
export const BURNED = 2;

export const GRASS = 0;
export const SHRUB = 1;
export const FOREST = 2;

/** Probabilidad de contagio por paso a un vecino, por vegetación del vecino. */
export const SPREAD_PROBABILITY: readonly number[] = [0.05, 0.026, 0.011];
/** Pasos que arde una celda, por su vegetación. */
export const BURN_STEPS: readonly number[] = [40, 80, 200];
/** Peso del contagio en diagonal respecto al ortogonal. */
export const DIAGONAL_WEIGHT = 0.7;

/** Multiplicador de viento: a favor (cos=1, fuerza=1) y en contra (cos=-1, fuerza=1). */
export const WIND_MAX_MULTIPLIER = 2.0;
export const WIND_MIN_MULTIPLIER = 0.5;

/** Cambio de viento cada 20-40 s con giro máximo de 45 grados. */
export const WIND_CHANGE_MIN_S = 20;
export const WIND_CHANGE_MAX_S = 40;
export const WIND_MAX_TURN = Math.PI / 4;