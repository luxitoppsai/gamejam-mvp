import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH, DEFAULT_SEED, TILE_SIZE } from "@vov/core";
import { CellularFire, WindController } from "../sim";
import { FireRenderer } from "../render/FireRenderer";

export interface SceneStats {
  fps: number;
  stepMs: number;
  renderMs: number;
  size: number;
  seed: number;
  tick: number;
  burning: number;
  burned: number;
  burnedPct: number;
  windDeg: number;
  windStrength: number;
  autoWind: boolean;
  paused: boolean;
  checksum: number;
}

/** Velocidad de simulación respecto al tiempo real (1 = 10 pasos/s). */
const SPEEDS = [0.5, 1, 2, 4];

export class MainScene extends Phaser.Scene {
  private fire!: CellularFire;
  private wind!: WindController;
  private fireView!: FireRenderer;
  private size = 128;
  private seed = DEFAULT_SEED;
  private paused = false;
  private autoWind = false;
  private speedIdx = 1;
  private zoomLevels: number[] = [1];
  private zoomIdx = 0;
  private stepMs = 0;
  private renderMs = 0;
  private keys!: {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
  };

  constructor() {
    super("MainScene");
  }

  init(data: { size?: number; seed?: number }): void {
    if (data.size) this.size = data.size;
    if (data.seed !== undefined) this.seed = data.seed;
  }

  create(): void {
    this.fire = new CellularFire({ width: this.size, height: this.size, seed: this.seed });
    this.wind = new WindController(this.fire, this.seed, 0, 0.6);
    this.fireView = new FireRenderer(this, this.fire);

    const mapPx = this.size * TILE_SIZE;
    const cam = this.cameras.main;
    const fit = Math.min(BASE_WIDTH / mapPx, BASE_HEIGHT / mapPx);
    this.zoomLevels = [fit, 0.25, 0.5, 1].filter((z, i, a) => z >= fit - 1e-9 && a.indexOf(z) === i).sort((a, b) => a - b);
    this.zoomIdx = 0;
    cam.setZoom(this.zoomLevels[0]!);
    cam.centerOn(mapPx / 2, mapPx / 2);

    this.input.mouse?.disableContextMenu();
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const cx = Math.floor(p.worldX / TILE_SIZE);
      const cy = Math.floor(p.worldY / TILE_SIZE);
      if (p.rightButtonDown()) {
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) this.fire.extinguish(cx + dx, cy + dy, 255);
      } else {
        this.fire.ignite(cx, cy);
      }
    });
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => this.zoomStep(dy < 0 ? 1 : -1));

    const kb = this.input.keyboard!;
    this.keys = {
      cursors: kb.createCursorKeys(),
      wasd: kb.addKeys("W,A,S,D") as Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>,
    };
    kb.on("keydown-SPACE", () => this.togglePause());
    kb.on("keydown-Z", () => this.zoomStep(1));
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const cam = this.cameras.main;
    const { cursors, wasd } = this.keys;
    const pan = (260 * dt) / cam.zoom;
    if (cursors.left.isDown || wasd.A.isDown) cam.scrollX -= pan;
    if (cursors.right.isDown || wasd.D.isDown) cam.scrollX += pan;
    if (cursors.up.isDown || wasd.W.isDown) cam.scrollY -= pan;
    if (cursors.down.isDown || wasd.S.isDown) cam.scrollY += pan;

    if (!this.paused) {
      const simDt = dt * SPEEDS[this.speedIdx]!;
      if (this.autoWind) this.wind.update(simDt);
      const tick = this.fire.tick;
      const t0 = performance.now();
      this.fire.step(simDt);
      // Solo se mide cuando hubo un paso real (10 Hz de simulación vs 60 FPS de dibujo).
      if (this.fire.tick !== tick) this.stepMs = this.stepMs * 0.8 + (performance.now() - t0) * 0.2;
    }
    const t1 = performance.now();
    this.fireView.update();
    this.renderMs = this.renderMs * 0.9 + (performance.now() - t1) * 0.1;
  }

  // ---- API para el panel de depuración (DOM) ----
  togglePause(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }
  toggleAutoWind(): boolean {
    this.autoWind = !this.autoWind;
    return this.autoWind;
  }
  cycleSpeed(): number {
    this.speedIdx = (this.speedIdx + 1) % SPEEDS.length;
    return SPEEDS[this.speedIdx]!;
  }
  zoomStep(dir: number): void {
    this.zoomIdx = (this.zoomIdx + dir + this.zoomLevels.length) % this.zoomLevels.length;
    this.cameras.main.setZoom(this.zoomLevels[this.zoomIdx]!);
  }
  rotateWind(deltaRad: number): void {
    this.wind.set(this.wind.current.direction + deltaRad, this.wind.current.strength);
  }
  changeWindStrength(delta: number): void {
    const s = Math.min(1, Math.max(0, this.wind.current.strength + delta));
    this.wind.set(this.wind.current.direction, s);
  }
  igniteCenter(): void {
    const c = Math.floor(this.size / 2);
    this.fire.ignite(c, c);
  }
  ignitePoints(n: number): void {
    // Puntos fijos (no aleatorios) para que la demo sea reproducible.
    for (let k = 0; k < n; k++) {
      this.fire.ignite(Math.floor(((k * 37 + 11) % 97) / 97 * this.size), Math.floor(((k * 53 + 29) % 89) / 89 * this.size));
    }
  }
  restart(opts: { size?: number; seed?: number }): void {
    this.scene.restart(opts);
  }
  get currentSeed(): number {
    return this.seed;
  }
  get currentSize(): number {
    return this.size;
  }

  getStats(): SceneStats {
    const s = this.fire.stats();
    const w = this.wind.current;
    return {
      fps: this.game.loop.actualFps,
      stepMs: this.stepMs,
      renderMs: this.renderMs,
      size: this.size,
      seed: this.seed,
      tick: this.fire.tick,
      burning: s.burning,
      burned: s.burned,
      burnedPct: s.burnedFraction * 100,
      windDeg: ((w.direction * 180) / Math.PI) % 360,
      windStrength: w.strength,
      autoWind: this.autoWind,
      paused: this.paused,
      checksum: this.fire.checksum(),
    };
  }
}