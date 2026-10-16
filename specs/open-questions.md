# Preguntas abiertas y supuestos

Anota aquí cualquier ambigüedad antes de decidir por tu cuenta. Al resolver, mueve a "Resueltas" con fecha y quién decidió.

## Abiertas

| # | Pregunta | Afecta | Dueño |
|---|----------|--------|-------|
| Q11 | **Balance del juego base sin validar con personas.** Un equipo de 4 bots simples contiene el fuego en 7 de 8 semillas pero reforesta mal; sin intervención se pierde en ~5 min. Falta probar con humanos: velocidad/rampa del fuego, potencia de extinción, y la regla de regeneración (un árbol adulto regenera 5 celdas). | juego base | equipo (prueba con personas) |
| Q4 | Validación de datos ecológicos con especialistas forestales (necesaria solo antes de publicar) | contenido | por definir; ver nota en Resueltas |

## Supuestos (revisar)

- Duración objetivo de 10-15 min por nivel, por validar con pruebas.
- Las especies (queñua, shihuahuaco, caoba) son ejemplos, no datos validados.
- Los valores de `specs/balance.md` son iniciales y se ajustan en pruebas.
- El plazo de 2 días cuenta desde el 2026-10-16 (revisión conjunta el 2026-10-18).

## Resueltas

| # | Decisión | Fecha | Decidió |
|---|----------|-------|---------|
| Q8 | `FireModel` gana `setFirebreak`/`isFirebreak`: la zanja es una celda que no arde ni contagia. Implementado en `CellularFire` y `MockFireModel`. | 2026-10-16 | Claude (propuesta), pendiente de revisión del equipo |
| Q9 | `PlayerCommand` gana `transferWater {toPlayer}` y `refill`; la arena los emite como comandos (ya no hay eventos locales aparte). | 2026-10-16 | Claude (propuesta), pendiente de revisión del equipo |
| Q10 | Arte y render compartidos en `@vov/view` (tileset, `WorldRenderer`, `ArenaView`, entrada); la simulación en `@vov/fire` y la lógica en `@vov/gameplay`. Las PoC 1 y 2 ya los usan. | 2026-10-16 | Luis ("hazlo"), Claude implementa |
| Q1 | **No hay roles fijos por persona: el rol lo da el ítem que se tiene en la mano.** El "Botánico" es quien sostiene semillas; esa misma persona puede soltarlas y tomar una manguera u otro ítem útil en combate. Así el Botánico no queda inactivo: en combate cambia a un ítem de combate y vuelve a las semillas en la reforestación. Cualquier jugador puede tomar cualquier ítem. Hipótesis a validar en la PoC 2: un solo ítem activo a la vez. | 2026-10-16 | Luis |
| Q2 | Valores de balance definidos por Claude como punto de partida: ver `specs/balance.md`. | 2026-10-16 | Luis (delegó), Claude propone |
| Q3 | Tiempo fijo de las PoC: **2 días** (2026-10-16 a 2026-10-18). Solo entran mecánicas MVP; las opcionales (M08, M11-M13, M18, M22) quedan fuera salvo que sobre tiempo. | 2026-10-16 | Luis |
| Q4 (alcance PoC) | Para las PoC se usan datos ecológicos de ejemplo marcados como no validados. Claude no puede contactar especialistas; la validación se hace antes de publicar. Claude puede preparar la lista de afirmaciones a validar. | 2026-10-16 | Luis / Claude |
| Q5 | No hay reparto fijo. Cada PoC queda como tareas en el SDD y la toma quien esté libre, anotando su nombre en `specs/README.md` (ver "Tomar una PoC"). | 2026-10-16 | Luis |
| Q6 | Título se mantiene por ahora: **Verde Otra Vez**. | 2026-10-16 | Luis |
| Q7 | **Monorepo** único (este repo). | 2026-10-16 | Luis |