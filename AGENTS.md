# AGENTS.md - guía para LLMs y colaboradores

Proyecto: **Verde Otra Vez** (cooperativo top-down, 4 jugadores, incendio forestal en Perú). Este repo contiene 4 PoC independientes sobre Phaser 3 + TypeScript + Vite.

Fuente de verdad: `specs/`. Origen del diseño: `Verde Otra Vez Documento técnico de diseño.pdf` (raíz).

## Flujo obligatorio (Spec-Driven Development)

1. Lee `specs/constitution.md` y la carpeta `specs/poc-N-*/` de tu PoC (`spec.md` -> `plan.md` -> `tasks.md`).
2. Si el cambio altera comportamiento, **edita primero la spec** (y el plan si cambia el diseño), luego el código.
3. Trabaja tareas de `tasks.md` de una en una; marca `[x]` al terminar y deja el criterio de aceptación verificado.
4. Si la spec es ambigua o contradice el código, no adivines: anótalo en `specs/open-questions.md` y pregunta.
5. Cada requisito (`FR-*`/`NFR-*`) debe poder rastrearse a una tarea y a una prueba o métrica.

## Antes de empezar

- Toma una PoC libre siguiendo `specs/README.md` (sección *Tomar una PoC*) y no toques las de otros.
- Plazo de 2 días: solo mecánicas MVP; lo marcado *opcional* queda fuera salvo que sobre tiempo.
- Valores numéricos: `specs/balance.md` (no los hardcodees sin referenciarlo).

## Reglas duras

- Una PoC solo depende de otras vía interfaces de `@vov/core` (`FireModel`, `TerrainGrid`, `PlayerCommand`, `NetSession`). Lo que no es suyo se mockea.
- `packages/core` y toda la simulación: **sin Phaser, sin `Math.random()`, sin `Date.now()`** (determinismo; corre igual en servidor y tests).
- Tile 16x16, resolución base 320x224, `pixelArt: true`.
- Cambiar una interfaz de `core` requiere actualizar `specs/contracts.md` y avisar a todas las PoC.
- Alcance: solo mecánicas del catálogo (`specs/mechanics-catalog.md`). Nada MVP+ sin spec.
- Arte y audio originales o de licencia libre verificada; no usar material de ZAMN. El arte provisional vive en `assets/reference/` (Kenney, CC0; ver su README): sirve de referencia y de placeholder, no es el arte final.
- Datos ecológicos son ejemplos hasta validación con especialistas; no presentarlos como hechos.
- Archivos < 500 líneas. No commitear secretos ni `.env`.

## Comandos

```bash
npm install
npm run dev:fuego | dev:roles | dev:red | dev:terreno
npm run typecheck
npm test
```