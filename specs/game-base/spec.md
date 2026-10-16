# Juego base - Verde Otra Vez

Estado: Borrador

## Pregunta que responde
¿Las piezas validadas en las PoC (fuego, roles por ítem, reforestación) se sostienen juntas en una partida completa de punta a punta?

## Mecánicas (catálogo)
M01 movimiento, M02 tomar/soltar, M03 agua y Soporte, M05-M07 fuego, M09 zanja, M14 estados del terreno, M15 reforestación, M16 fases y victoria/derrota, M17 HUD y minimapa.

## Alcance
**Incluye:** una partida local de 1 a 4 jugadores en mapa de 128x128: preparación -> incendio -> reforestación -> cierre, con fuego real y viento, fuentes naturales, regeneración y pantallas de menú y resultado.
**No incluye / pendiente:** red (PoC 3), mapa Tiled, riego, audio (M18), mecánicas opcionales (M08, M11-M13, M22), cierre educativo con datos (M25, requiere validación; Q4), bots.

## Requisitos funcionales
- FR-GB.1 La partida recorre las 4 fases con la máquina de estados de `Match` (preparación, incendio, reforestación, cierre).
- FR-GB.2 Derrota si el fuego supera el 70% del mapa o vence la reforestación sin alcanzar la meta; victoria al regenerar el 50% de lo quemado.
- FR-GB.3 El rol lo da el ítem en mano (Q1); cualquier jugador toma cualquier ítem.
- FR-GB.4 El HUD muestra fase y tiempo, % afectado frente al límite, progreso de regeneración, viento, minimapa y jugadores.
- FR-GB.5 La partida es determinista con la misma semilla y entradas (`Match` no usa `Math.random()` ni `Date.now()`).

## Requisitos no funcionales
- NFR-GB.1 60 FPS en el mapa de 128x128 con fuego activo en hardware modesto (por confirmar fuera de la GTX 1660 SUPER).
- NFR-GB.2 La lógica (`@vov/fire`, `@vov/gameplay`) no importa Phaser y se prueba sin navegador.

## Criterios de aceptación
- AC-GB.1 Una partida puede ganarse y perderse por las rutas definidas (probado en `Match.test.ts` y en navegador).
- AC-GB.2 Sin intervención el incendio supera el 70% (derrota) en el orden de 5 min.
- AC-GB.3 Con 3-4 personas la partida dura 10-15 min y se entiende sin explicación (por validar; Q11).

## Interfaces (de specs/contracts.md)
`FireModel` (con cortafuego), `PlayerCommand` (con `transferWater` y `refill`). La red usará `NetSession` (PoC 3).

## Riesgos y salida prevista
El balance es el riesgo principal: con parámetros distintos el incendio se contiene casi siempre o se pierde siempre (Q11). Salida: ajustar `matchParams.ts` y `balance.md` tras pruebas con personas.

## Historial
- 2026-10-16: borrador inicial, implementado en `packages/game`.
