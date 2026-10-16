import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "@vov/core";
import { MainScene } from "./scenes/MainScene";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  pixelArt: true,
  backgroundColor: "#1b1b1b",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MainScene],
});

const scene = (): MainScene => game.scene.getScene("MainScene") as MainScene;
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const actions: Record<string, () => void> = {
  restart: () => scene().restart({}),
  newseed: () => scene().restart({ seed: Math.floor(Math.random() * 1e6) }),
  size64: () => scene().restart({ size: 64 }),
  size128: () => scene().restart({ size: 128 }),
  pause: () => ($("btn-pause").textContent = scene().togglePause() ? "Reanudar" : "Pausa"),
  speed: () => ($("btn-speed").textContent = `Velocidad x${scene().cycleSpeed()}`),
  zoom: () => scene().zoomStep(1),
  windl: () => scene().rotateWind(-Math.PI / 4),
  windr: () => scene().rotateWind(Math.PI / 4),
  windup: () => scene().changeWindStrength(0.1),
  winddown: () => scene().changeWindStrength(-0.1),
  autowind: () => ($("btn-autowind").textContent = scene().toggleAutoWind() ? "Auto-viento: sí" : "Auto-viento: no"),
  center: () => scene().igniteCenter(),
  many: () => scene().ignitePoints(8),
};
for (const [id, fn] of Object.entries(actions)) $(`btn-${id}`).addEventListener("click", fn);

setInterval(() => {
  const s = scene();
  if (!s || !s.scene.isActive()) return;
  const st = s.getStats();
  $("stats").textContent =
    `FPS ${st.fps.toFixed(0)} | sim ${st.stepMs.toFixed(2)} ms | dibujo ${st.renderMs.toFixed(2)} ms\n` +
    `mapa ${st.size}x${st.size} | semilla ${st.seed} | paso ${st.tick}\n` +
    `ardiendo ${st.burning} | quemado ${st.burnedPct.toFixed(1)}%\n` +
    `viento ${st.windDeg.toFixed(0)} deg, fuerza ${st.windStrength.toFixed(1)}\n` +
    `checksum ${st.checksum.toString(16).padStart(8, "0")}`;
}, 250);