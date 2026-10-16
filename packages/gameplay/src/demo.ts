import { TILE_SIZE } from "@vov/core";
import { Arena } from "./Arena";
import { MockFireModel } from "./MockFireModel";
import { generateTerrain } from "./demoMap";
import type { ItemKind } from "./roles/items";

export interface DemoArenaOptions {
  width?: number;
  height?: number;
  seed?: number;
}

/** Arena de la PoC 2: fuego mock, zona de preparación a la izquierda, fuentes y un primer foco. */
export function createDemoArena(opts: DemoArenaOptions = {}): Arena<MockFireModel> {
  const width = opts.width ?? 40;
  const height = opts.height ?? 28;
  const clear = (x: number, y: number) => x <= 14 || (y >= 13 && y <= 15) || Math.hypot(x - 36, y - 14) < 4;
  const arena = new Arena<MockFireModel>({
    width,
    height,
    fire: new MockFireModel(width, height),
    terrain: generateTerrain(width, height, opts.seed ?? 1337, clear),
  });
  const items: [ItemKind, number, number][] = [
    ["hose", 9, 12], ["hose", 9, 16], ["extinguisher", 10, 14],
    ["backpack", 8, 13], ["backpack", 8, 15],
    ["shovel", 11, 12], ["shovel", 11, 16],
    ["seeds", 12, 14], ["radio", 12, 12], ["drone", 12, 16],
  ];
  for (const [kind, tx, ty] of items) arena.spawnItem(kind, (tx + 0.5) * TILE_SIZE, (ty + 0.5) * TILE_SIZE);
  arena.fountains.push({ x: 2, y: 9 }, { x: 2, y: 19 });
  arena.fire.ignite(36, 14);
  return arena;
}
