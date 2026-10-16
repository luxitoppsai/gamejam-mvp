import { describe, expect, it } from "vitest";
import { Match } from "./Match";
import type { PlayerInput } from "./Arena";

const NONE = new Map<number, PlayerInput>();
const run = (m: Match, seconds: number, dt = 0.1) => {
  for (let t = 0; t < seconds; t += dt) m.update(dt, NONE);
};

describe("Match: fases", () => {
  it("arranca en preparación y pasa al incendio al cumplirse el plazo", () => {
    const m = new Match({ size: 48, prepSeconds: 5 });
    expect(m.phase).toBe("prep");
    expect(m.fire.stats().burning).toBe(0);
    run(m, 4);
    expect(m.phase).toBe("prep");
    run(m, 2);
    expect(m.phase).toBe("fire");
    expect(m.fire.stats().burning).toBeGreaterThan(0);
  });

  it("skipPrep salta la preparación", () => {
    const m = new Match({ size: 48 });
    m.skipPrep();
    expect(m.phase).toBe("fire");
  });

  it("si el fuego arrasa el mapa, derrota por quemado", () => {
    const m = new Match({ size: 48, prepSeconds: 0.1, loseFraction: 0.02 });
    run(m, 600);
    expect(m.phase).toBe("closing");
    expect(m.outcome).toBe("lose-burned");
  });

  it("es determinista: misma semilla, mismo desenlace", () => {
    const go = () => {
      const m = new Match({ size: 40, seed: 7, prepSeconds: 0.1, loseFraction: 1.1 });
      run(m, 900);
      return [m.phase, m.burnedAtFireEnd, m.fire.checksum()];
    };
    expect(go()).toEqual(go());
  });
});

describe("Match: reforestación", () => {
  /** Partida pequeña que llega a reforestación sin que nadie apague nada. */
  const toReforest = () => {
    const m = new Match({ size: 40, seed: 3, prepSeconds: 0.1, loseFraction: 1.1, reforestSeconds: 50 });
    for (let t = 0; t < 3000 && m.phase !== "reforest"; t++) m.update(0.1, NONE);
    return m;
  };

  it("al apagarse el incendio entra a reforestación con una meta del 50% de lo quemado", () => {
    const m = toReforest();
    expect(m.phase).toBe("reforest");
    expect(m.burnedAtFireEnd).toBeGreaterThan(0);
    expect(m.goal).toBe(Math.ceil(m.burnedAtFireEnd * 0.5));
  });

  it("sin sembrar nada se pierde por tiempo", () => {
    const m = toReforest();
    run(m, 60);
    expect(m.phase).toBe("closing");
    expect(m.outcome).toBe("lose-time");
  });

  it("los brotes adultos regeneran celdas y alcanzar la meta gana", () => {
    const m = toReforest();
    const s = m.size;
    // Siembra un brote ya crecido en cada celda quemada alterna hasta cubrir la meta.
    let planted = 0;
    for (let i = 0; i < s * s && m.regrownCount < m.goal; i++) {
      if (m.fire.states[i] !== 2 || m.regrown[i]) continue;
      m.arena.saplings.set(i, 40);
      planted++;
      m.update(0.01, NONE);
    }
    m.update(0.1, NONE);
    expect(m.regrownCount).toBeGreaterThanOrEqual(m.goal);
    expect(m.outcome).toBe("win");
    expect(planted).toBeLessThan(m.goal + 1); // cada árbol regenera más de una celda
  });

  it("durante el cierre los jugadores ya no se mueven", () => {
    const m = toReforest();
    m.arena.addPlayer(1);
    run(m, 60);
    const { x } = m.arena.player(1);
    m.update(0.5, new Map([[1, { moveX: 1, moveY: 0, interact: false, use: false }]]));
    expect(m.arena.player(1).x).toBe(x);
  });
});
