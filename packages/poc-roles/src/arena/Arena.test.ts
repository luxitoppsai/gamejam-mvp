import { describe, expect, it } from "vitest";
import { TILE_SIZE } from "@vov/core";
import { Arena, IDLE_INPUT } from "./Arena";
import type { PlayerInput } from "./Arena";
import { MockFireModel } from "../mock/MockFireModel";

const px = (t: number) => (t + 0.5) * TILE_SIZE;
const inputs = (m: Record<number, Partial<PlayerInput>>) =>
  new Map(Object.entries(m).map(([id, v]) => [Number(id), { ...IDLE_INPUT, ...v }]));

/** Arena vacía de 30x9 sin árboles para pruebas controladas. */
const empty = () => new Arena({ width: 30, height: 9, populate: false });

function take(a: Arena, id: number, kind: Parameters<Arena["spawnItem"]>[0]) {
  const p = a.player(id);
  a.spawnItem(kind, p.x, p.y);
  a.update(0.016, inputs({ [id]: { interact: true } }));
  a.update(0.016, inputs({ [id]: { interact: false } }));
}

describe("MockFireModel", () => {
  it("se propaga y una zanja completa lo detiene", () => {
    const run = (trench: boolean) => {
      const f = new MockFireModel(20, 9);
      if (trench) for (let y = 0; y < 9; y++) f.setFirebreak(10, y, true);
      f.ignite(5, 4);
      for (let t = 0; t < 600; t++) f.step(0.25);
      let maxX = 0;
      for (let i = 0; i < f.states.length; i++) if (f.states[i] !== 0) maxX = Math.max(maxX, i % 20);
      return maxX;
    };
    expect(run(false)).toBe(19);
    expect(run(true)).toBeLessThan(10); // AC-2.2
  });

  it("es determinista", () => {
    const run = () => {
      const f = new MockFireModel(16, 16);
      f.ignite(8, 8);
      for (let i = 0; i < 100; i++) f.step(0.25);
      return Array.from(f.states).join("");
    };
    expect(run()).toBe(run());
  });

  it("extinguish gasta el calor y deja ceniza", () => {
    const f = new MockFireModel(4, 4);
    f.ignite(1, 1);
    f.extinguish(1, 1, 50);
    expect(f.getCell(1, 1).state).toBe("burning");
    f.extinguish(1, 1, 60);
    expect(f.getCell(1, 1).state).toBe("burned");
  });
});

describe("roles dinámicos por ítem (Q1)", () => {
  it("el rol lo da el ítem en mano y cambia al intercambiar", () => {
    const a = empty();
    a.addPlayer(1);
    expect(a.roleOf(1)).toBeNull();
    take(a, 1, "seeds");
    expect(a.roleOf(1)).toBe("botanico");
    take(a, 1, "hose"); // el Botánico cambia a un ítem de combate
    expect(a.roleOf(1)).toBe("sofocador");
    expect(a.groundItems.some((i) => i.kind === "seeds")).toBe(true); // las semillas quedaron en el suelo
  });

  it("soltar deja al jugador sin rol", () => {
    const a = empty();
    a.addPlayer(1);
    take(a, 1, "shovel");
    a.update(0.016, inputs({ 1: { interact: true } }));
    expect(a.roleOf(1)).toBeNull();
  });
});

describe("agua y Soporte (AC-2.1)", () => {
  it("un Sofocador sin Soporte se queda sin agua en pocos segundos", () => {
    const a = empty();
    a.addPlayer(1);
    take(a, 1, "hose");
    let t = 0;
    while (a.player(1).item!.water > 0 && t < 30) {
      a.update(0.05, inputs({ 1: { use: true } }));
      t += 0.05;
    }
    expect(t).toBeLessThan(8);
    a.update(0.05, inputs({ 1: { use: true } }));
    expect(a.player(1).spraying).toBe(false);
  });

  it("con Soporte puede seguir rociando", () => {
    const a = empty();
    a.addPlayer(1);
    a.addPlayer(2);
    a.teleport(2, a.player(1).x + 10, a.player(1).y);
    take(a, 1, "hose");
    take(a, 2, "backpack");
    for (let i = 0; i < 400; i++) a.update(0.05, inputs({ 1: { use: true }, 2: { use: true } })); // 20 s
    expect(a.player(1).item!.water).toBeGreaterThan(0);
    expect(a.player(1).spraying).toBe(true);
  });

  it("la mochila se recarga solo en una fuente", () => {
    const a = empty();
    a.fountains.push({ x: 3, y: 4 });
    a.addPlayer(1);
    take(a, 1, "backpack");
    a.player(1).item!.water = 0;
    for (let i = 0; i < 40; i++) a.update(0.05, inputs({ 1: { use: true } }));
    expect(a.player(1).item!.water).toBe(0); // lejos de la fuente
    a.teleport(1, px(3), px(4));
    for (let i = 0; i < 40; i++) a.update(0.05, inputs({ 1: { use: true } }));
    expect(a.player(1).item!.water).toBeGreaterThan(40);
  });

  it("rociar apaga fuego real del mock", () => {
    const a = empty();
    a.addPlayer(1);
    a.teleport(1, px(5), px(4));
    take(a, 1, "hose");
    a.fire.ignite(7, 4);
    for (let i = 0; i < 60; i++) a.update(0.05, inputs({ 1: { use: true } }));
    expect(a.fire.getCell(7, 4).state).toBe("burned");
  });
});

describe("zanja (M09) y siembra", () => {
  it("la pala abre una zanja en la celda de enfrente tras digSeconds", () => {
    const a = empty();
    a.addPlayer(1);
    a.teleport(1, px(5), px(4));
    take(a, 1, "shovel");
    for (let i = 0; i < 20; i++) a.update(0.05, inputs({ 1: { use: true } })); // 1 s
    expect(a.fire.isFirebreak(6, 4)).toBe(false);
    for (let i = 0; i < 20; i++) a.update(0.05, inputs({ 1: { use: true } })); // 2 s
    expect(a.fire.isFirebreak(6, 4)).toBe(true);
  });

  it("las semillas solo se plantan sobre celdas quemadas", () => {
    const a = empty();
    a.addPlayer(1);
    a.teleport(1, px(5), px(4));
    take(a, 1, "seeds");
    for (let i = 0; i < 30; i++) a.update(0.05, inputs({ 1: { use: true } }));
    expect(a.hasSapling(6, 4)).toBe(false);
    a.fire.ignite(6, 4);
    a.fire.extinguish(6, 4, 1000);
    for (let i = 0; i < 30; i++) a.update(0.05, inputs({ 1: { use: true } }));
    expect(a.hasSapling(6, 4)).toBe(true);
  });
});

describe("movimiento y comandos", () => {
  it("los árboles bloquean y los límites del mapa también", () => {
    const a = empty();
    a.addPlayer(1);
    a.teleport(1, px(0), px(4));
    for (let i = 0; i < 40; i++) a.update(0.05, inputs({ 1: { moveX: -1 } }));
    expect(a.player(1).x).toBeGreaterThanOrEqual(5);
  });

  it("emite PlayerCommand al tomar y al rociar", () => {
    const a = empty();
    const cmds: string[] = [];
    a.onEvent((e) => e.type === "command" && cmds.push(e.command.type));
    a.addPlayer(1);
    a.teleport(1, px(5), px(4));
    take(a, 1, "hose");
    for (let i = 0; i < 10; i++) a.update(0.05, inputs({ 1: { use: true } }));
    expect(cmds).toContain("swapItem");
    expect(cmds).toContain("extinguish");
  });
});