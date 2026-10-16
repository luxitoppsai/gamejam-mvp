import type { FireModel } from "@vov/core";
import { WIND_CHANGE_MAX_S, WIND_CHANGE_MIN_S, WIND_MAX_TURN } from "./params";
import { mulberry32 } from "./rng";

/**
 * Viento variable: cada 20-40 s gira como máximo 45 grados y varía algo la fuerza.
 * Determinista (su propio PRNG con semilla), separado del RNG del fuego.
 */
export class WindController {
  private readonly rng: () => number;
  private direction: number;
  private strength: number;
  private timeLeft: number;

  constructor(private readonly model: FireModel, seed: number, direction = 0, strength = 0.6) {
    this.rng = mulberry32((seed ^ 0x51ed270b) >>> 0);
    this.direction = direction;
    this.strength = strength;
    this.timeLeft = this.nextInterval();
    this.model.setWind(direction, strength);
  }

  update(dt: number): void {
    this.timeLeft -= dt;
    while (this.timeLeft <= 0) {
      this.direction += (this.rng() * 2 - 1) * WIND_MAX_TURN;
      this.strength = Math.min(1, Math.max(0.2, this.strength + (this.rng() * 2 - 1) * 0.2));
      this.model.setWind(this.direction, this.strength);
      this.timeLeft += this.nextInterval();
    }
  }

  /** Fija el viento a mano y reinicia el temporizador. */
  set(direction: number, strength: number): void {
    this.direction = direction;
    this.strength = strength;
    this.model.setWind(direction, strength);
    this.timeLeft = this.nextInterval();
  }

  get current(): { direction: number; strength: number } {
    return { direction: this.direction, strength: this.strength };
  }

  private nextInterval(): number {
    return WIND_CHANGE_MIN_S + this.rng() * (WIND_CHANGE_MAX_S - WIND_CHANGE_MIN_S);
  }
}