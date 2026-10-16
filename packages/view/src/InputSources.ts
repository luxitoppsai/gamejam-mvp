import Phaser from "phaser";
import { IDLE_INPUT } from "@vov/gameplay";
import type { PlayerInput } from "@vov/gameplay";

export const MAX_PLAYERS = 4;

type Scheme = { up: string; down: string; left: string; right: string; interact: string; use: string; label: string };
/** Esquemas de teclado: J1 izquierda, J2 flechas, J3 IJKL. Los gamepads se unen solos al pulsar un botón. */
export const SCHEMES: Scheme[] = [
  { up: "W", down: "S", left: "A", right: "D", interact: "E", use: "F", label: "WASD + E (tomar/soltar) + F (usar)" },
  { up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", interact: "PERIOD", use: "FORWARD_SLASH", label: "Flechas + . (tomar/soltar) + / (usar)" },
  { up: "I", down: "K", left: "J", right: "L", interact: "U", use: "O", label: "IJKL + U (tomar/soltar) + O (usar)" },
];

export type Slot = { id: number; kind: "kb"; scheme: number } | { id: number; kind: "pad"; pad: number };

export class InputSources {
  readonly slots: Slot[] = [];
  private readonly keys = new Map<number, Record<keyof Omit<Scheme, "label">, Phaser.Input.Keyboard.Key>>();
  private nextId = 1;
  /** Toques de "tomar/soltar" recibidos desde el último poll (no se pierden si la tecla sube dentro del mismo frame). */
  private readonly tapped = new Set<number>();

  constructor(private readonly scene: Phaser.Scene, private readonly onJoin: (slot: Slot) => void) {
    scene.input.keyboard?.addCapture("UP,DOWN,LEFT,RIGHT,SPACE,PERIOD,FORWARD_SLASH");
  }

  /** Recrea los slots de una partida anterior (al reiniciar la escena). */
  restore(slots: Slot[]): void {
    for (const s of slots) {
      if (s.kind === "kb") this.addKeyboard(s.scheme);
      else this.add({ id: this.nextId++, kind: "pad", pad: s.pad });
    }
  }

  /** Une al siguiente esquema de teclado libre. Devuelve el slot o null si no hay. */
  addKeyboard(scheme?: number): Slot | null {
    if (this.slots.length >= MAX_PLAYERS) return null;
    const used = new Set(this.slots.filter((s) => s.kind === "kb").map((s) => (s as { scheme: number }).scheme));
    const idx = scheme ?? SCHEMES.findIndex((_, i) => !used.has(i));
    if (idx < 0 || idx >= SCHEMES.length || used.has(idx)) return null;
    const sc = SCHEMES[idx]!;
    const code = (name: string) => (Phaser.Input.Keyboard.KeyCodes as Record<string, number>)[name]!;
    const kb = this.scene.input.keyboard!;
    const slot: Slot = { id: this.nextId++, kind: "kb", scheme: idx };
    const interactKey = kb.addKey(code(sc.interact));
    interactKey.on("down", () => this.tapped.add(slot.id));
    this.keys.set(slot.id, {
      up: kb.addKey(code(sc.up)),
      down: kb.addKey(code(sc.down)),
      left: kb.addKey(code(sc.left)),
      right: kb.addKey(code(sc.right)),
      interact: interactKey,
      use: kb.addKey(code(sc.use)),
    });
    return this.add(slot);
  }

  private add(slot: Slot): Slot {
    this.slots.push(slot);
    this.onJoin(slot);
    return slot;
  }

  poll(): Map<number, PlayerInput> {
    const out = new Map<number, PlayerInput>();
    const pads = (typeof navigator !== "undefined" && navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).filter(
      (p): p is Gamepad => !!p && p.connected,
    );
    for (const pad of pads) {
      const mapped = this.slots.some((s) => s.kind === "pad" && s.pad === pad.index);
      if (!mapped && this.slots.length < MAX_PLAYERS && pad.buttons.some((b) => b.pressed)) {
        this.add({ id: this.nextId++, kind: "pad", pad: pad.index });
      }
    }
    for (const s of this.slots) {
      if (s.kind === "kb") {
        const k = this.keys.get(s.id)!;
        out.set(s.id, {
          moveX: (k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0),
          moveY: (k.down.isDown ? 1 : 0) - (k.up.isDown ? 1 : 0),
          interact: k.interact.isDown || this.tapped.has(s.id),
          use: k.use.isDown,
        });
      } else {
        const pad = pads.find((p) => p.index === s.pad);
        if (!pad) {
          out.set(s.id, IDLE_INPUT);
          continue;
        }
        const dead = (v: number) => (Math.abs(v) < 0.25 ? 0 : v);
        const b = (i: number) => !!pad.buttons[i]?.pressed;
        out.set(s.id, {
          moveX: dead(pad.axes[0] ?? 0) || (b(15) ? 1 : 0) - (b(14) ? 1 : 0),
          moveY: dead(pad.axes[1] ?? 0) || (b(13) ? 1 : 0) - (b(12) ? 1 : 0),
          interact: b(0),
          use: b(2) || b(1),
        });
      }
    }
    this.tapped.clear();
    return out;
  }
}