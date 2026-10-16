import { describe, expect, it } from "vitest";
import { BURNED, BURNING, FOREST, GRASS, STEP_SECONDS, UNBURNED } from "./params";
import { CellularFire } from "./CellularFire";
import { WindController } from "./WindController";
import { uniformVegetation } from "./vegetation";
import { mulberry32 } from "./rng";

const run = (f: CellularFire, ticks: number) => {
  for (let i = 0; i < ticks; i++) f.step(STEP_SECONDS);
};

const uniform = (size: number, kind: number, seed = 1) =>
  new CellularFire({ width: size, height: size, seed, vegetation: uniformVegetation(size, size, kind) });

describe("PRNG", () => {
  it("misma semilla => misma secuencia", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
});

describe("CellularFire", () => {
  it("determinismo: misma semilla => mismo checksum en dos ejecuciones", () => {
    const make = () => {
      const f = new CellularFire({ width: 64, height: 64, seed: 1337 });
      f.setWind(1, 0.7);
      f.ignite(32, 32);
      run(f, 200);
      return f.checksum();
    };
    expect(make()).toBe(make());
  });

  it("semillas distintas => estados distintos", () => {
    const make = (seed: number) => {
      const f = new CellularFire({ width: 64, height: 64, seed });
      f.ignite(32, 32);
      run(f, 100);
      return f.checksum();
    };
    expect(make(1)).not.toBe(make(2));
  });

  it("ignite/getCell/extinguish", () => {
    const f = uniform(8, GRASS);
    expect(f.getCell(3, 3)).toEqual({ state: "unburned", vegetation: "grass" });
    f.ignite(3, 3);
    expect(f.getCell(3, 3).state).toBe("burning");
    f.extinguish(3, 3, 1000);
    expect(f.getCell(3, 3).state).toBe("burned");
    f.ignite(3, 3); // una celda quemada no vuelve a arder
    expect(f.getCell(3, 3).state).toBe("burned");
    expect(() => f.getCell(99, 0)).toThrow(RangeError);
  });

  it("extinguish parcial reduce combustible sin apagar", () => {
    const f = uniform(8, FOREST);
    f.ignite(2, 2);
    const before = f.burnLeft[2 * 8 + 2]!;
    f.extinguish(2, 2, 10);
    expect(f.burnLeft[2 * 8 + 2]).toBe(before - 10);
    expect(f.getCell(2, 2).state).toBe("burning");
  });

  it("una celda aislada arde su duración y queda en ceniza", () => {
    const f = new CellularFire({ width: 1, height: 1, vegetation: uniformVegetation(1, 1, GRASS) });
    f.ignite(0, 0);
    run(f, 14);
    expect(f.states[0]).toBe(BURNING);
    run(f, 1);
    expect(f.states[0]).toBe(BURNED);
  });

  it("el pastizal se propaga más rápido que el bosque", () => {
    const count = (kind: number) => {
      const f = uniform(81, kind);
      f.ignite(40, 40);
      run(f, 40);
      return f.stats().burning + f.stats().burned;
    };
    expect(count(GRASS)).toBeGreaterThan(count(FOREST) * 2);
  });

  it("el viento sesga el avance hacia donde sopla", () => {
    const meanX = (dir: number) => {
      const f = uniform(101, GRASS, 7);
      f.setWind(dir, 1);
      f.ignite(50, 50);
      run(f, 50);
      let sum = 0;
      let n = 0;
      for (let i = 0; i < f.states.length; i++) {
        if (f.states[i] !== UNBURNED) {
          sum += i % 101;
          n++;
        }
      }
      return sum / n;
    };
    expect(meanX(0)).toBeGreaterThan(53); // hacia el este
    expect(meanX(Math.PI)).toBeLessThan(47); // hacia el oeste
  });

  it("step acumula dt fraccionado igual que pasos exactos", () => {
    const a = uniform(32, GRASS, 3);
    const b = uniform(32, GRASS, 3);
    a.ignite(16, 16);
    b.ignite(16, 16);
    for (let i = 0; i < 50; i++) a.step(STEP_SECONDS);
    for (let i = 0; i < 100; i++) b.step(STEP_SECONDS / 2);
    expect(a.tick).toBe(b.tick);
    expect(a.checksum()).toBe(b.checksum());
  });
});

describe("WindController", () => {
  it("es determinista y respeta el giro máximo de 45 grados", () => {
    const trace = () => {
      const f = uniform(8, GRASS);
      const w = new WindController(f, 5);
      const dirs: number[] = [];
      let last = w.current.direction;
      for (let t = 0; t < 600; t++) {
        w.update(1);
        const d = w.current.direction;
        if (d !== last) {
          dirs.push(d - last);
          last = d;
        }
      }
      return dirs;
    };
    const a = trace();
    expect(a).toEqual(trace());
    expect(a.length).toBeGreaterThan(5);
    for (const delta of a) expect(Math.abs(delta)).toBeLessThanOrEqual(Math.PI / 4 + 1e-9);
  });
});