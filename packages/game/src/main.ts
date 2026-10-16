import Phaser from "phaser";
import { BASE_HEIGHT, BASE_WIDTH } from "@vov/core";
import { SCHEMES } from "@vov/view";
import { PlayScene } from "./scenes/PlayScene";
import type { HudState } from "./scenes/PlayScene";
import { drawMinimap } from "./ui/minimap";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  pixelArt: true,
  backgroundColor: "#1b1b1b",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PlayScene],
});

const scene = (): PlayScene => game.scene.getScene("PlayScene") as PlayScene;
const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
(window as unknown as { __game: () => PlayScene }).__game = scene;

const PHASES = ["prep", "fire", "reforest", "closing"] as const;
const PHASE_LABEL: Record<(typeof PHASES)[number], string> = {
  prep: "Preparación",
  fire: "Incendio",
  reforest: "Reforestación",
  closing: "Cierre",
};
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

$("controls").innerHTML =
  SCHEMES.map((s, i) => `<li><b>J${i + 1}</b> ${s.label}</li>`).join("") +
  "<li><b>Gamepad</b> stick + A (tomar/soltar) + X (usar); se une al pulsar un botón</li>";

$("btn-view").addEventListener("click", () => {
  $("btn-view").textContent = scene().toggleView() ? "Vista: completa" : "Vista: seguir equipo";
});
$("btn-menu").addEventListener("click", () => scene().toBase());

function overlay(html: string): void {
  $("card").innerHTML = html;
  $("overlay").classList.add("show");
  $("card").querySelectorAll<HTMLButtonElement>("button[data-act]").forEach((b) =>
    b.addEventListener("click", () => {
      const act = b.dataset.act!;
      if (act.startsWith("start")) scene().start(Number(act.slice(5)));
      else if (act === "again") scene().restart(true);
      else if (act === "menu") scene().toBase();
      b.blur();
    }),
  );
}

let shown = "";
function syncOverlay(h: HudState): void {
  const key = h.status === "menu" ? "menu" : h.phase === "closing" ? `end-${h.outcome}` : "";
  if (key === shown) return;
  shown = key;
  if (key === "") {
    $("overlay").classList.remove("show");
  } else if (key === "menu") {
    overlay(`
      <h2>Verde Otra Vez</h2>
      <p>Una brigada comunitaria apaga el incendio y vuelve a plantar el bosque.</p>
      <p class="muted">Prepárense en la base, contengan el fuego antes de que queme el 70 % y siembren sobre la ceniza hasta regenerar la mitad.</p>
      <div class="row">
        <button class="primary" data-act="start1">1 jugador</button>
        <button class="primary" data-act="start2">2 jugadores</button>
        <button class="primary" data-act="start3">3 jugadores</button>
      </div>
      <p class="muted">Un 4.º jugador se une con gamepad (pulsa un botón). Enter empieza con los jugadores actuales.</p>`);
  } else {
    const s = h.summary;
    const win = h.outcome === "win";
    const secs = clock(s.seconds);
    overlay(`
      <h2>${win ? "¡Bosque recuperado!" : "No alcanzó esta vez"}</h2>
      <p>${h.banner}</p>
      <table>
        <tr><td>Celdas quemadas</td><td>${s.burnedCells}</td></tr>
        <tr><td>Celdas regeneradas</td><td>${s.regrownCells} / ${s.goal}</td></tr>
        <tr><td>Árboles sembrados</td><td>${s.planted}</td></tr>
        <tr><td>Tiempo total</td><td>${secs}</td></tr>
      </table>
      <div class="row">
        <button class="primary" data-act="again">Jugar de nuevo (Enter)</button>
        <button data-act="menu">Menú</button>
      </div>`);
  }
}

setInterval(() => {
  const s = scene();
  if (!s || !s.scene.isActive() || !s.match) return;
  const h = s.getHud();
  syncOverlay(h);
  $("phase-name").textContent = h.status === "menu" ? "Menú" : PHASE_LABEL[h.phase];
  $("phase-time").textContent = h.status === "playing" && h.remaining > 0 ? clock(h.remaining) : "";
  const idx = h.status === "menu" ? -1 : PHASES.indexOf(h.phase);
  $("steps").innerHTML = PHASES.map((_, i) => `<i class="${i <= idx ? "on" : ""}"></i>`).join("");
  $("burn-txt").textContent = `${h.burnedPct.toFixed(1)} % de ${h.loseAtPct} %`;
  $("burn-bar").style.width = `${Math.min(100, h.burnedPct)}%`;
  $("regen-box").style.display = h.goal > 0 ? "" : "none";
  $("regen-txt").textContent = `${h.regrown} / ${h.goal} celdas`;
  $("regen-bar").style.width = `${h.goal > 0 ? Math.min(100, (h.regrown / h.goal) * 100) : 0}%`;
  $("wind").style.transform = `rotate(${h.windDeg}deg)`;
  $("wind-txt").textContent = `${Math.round(h.windStrength * 100)} %`;
  $("banner-text").textContent = h.status === "menu" ? "" : h.banner;
  $("players").innerHTML = h.players
    .map(
      (p) => `<div class="card" style="border-left-color:${p.color}">
        <div><b style="color:${p.color}">J${p.id}</b> <span style="color:${p.roleColor ?? "#888"}">${p.role ?? "sin rol"}</span></div>
        <div class="muted">${p.item ?? "manos vacías"}</div>
        ${p.waterPct === null ? "" : `<div class="bar"><i style="width:${p.waterPct}%;background:${p.waterPct > 25 ? "#3aa0ff" : "#ff5a3a"}"></i></div>`}
      </div>`,
    )
    .join("");
  $("log").textContent = h.log.join("\n") || "(sin acciones todavía)";
  drawMinimap($<HTMLCanvasElement>("mini"), s.match);
}, 250);
