import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "@vov/core";
import { MainScene } from "./scenes/MainScene";
import { SCHEMES } from "@vov/view";

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
(window as unknown as { __roles: () => MainScene }).__roles = scene;

$("btn-add").addEventListener("click", () => {
  if (!scene().addKeyboardPlayer()) $("btn-add").textContent = "Máximo de jugadores";
});
$("btn-restart").addEventListener("click", () => scene().restart());
$("btn-view").addEventListener("click", () => {
  $("btn-view").textContent = scene().toggleView() ? "Vista: completa" : "Vista: seguir equipo";
});
$("controls").innerHTML = SCHEMES.map((s, i) => `<li><b>J${i + 1}</b> ${s.label}</li>`).join("") + "<li><b>Gamepad</b> stick + A (tomar/soltar) + X (usar); se une al pulsar un botón</li>";

setInterval(() => {
  const s = scene();
  if (!s || !s.scene.isActive() || !s.arena) return;
  const h = s.getHud();
  $("players").innerHTML = h.players
    .map(
      (p) => `<div class="card" style="border-left-color:${p.color}">
        <div><b style="color:${p.color}">J${p.id}</b> <span style="color:${p.roleColor ?? "#888"}">${p.role ?? "sin rol"}</span></div>
        <div class="muted">${p.item ?? "manos vacías"}</div>
        ${p.waterPct === null ? "" : `<div class="bar"><i style="width:${p.waterPct}%;background:${p.waterPct > 25 ? "#3aa0ff" : "#ff5a3a"}"></i></div>`}
      </div>`,
    )
    .join("");
  $("fire").textContent = `Fuego: ${h.burning} celdas ardiendo | ${h.burnedPct.toFixed(0)}% afectado | ${h.saplings} brotes`;
  $("log").textContent = h.log.join("\n") || "(sin acciones todavía)";
}, 150);