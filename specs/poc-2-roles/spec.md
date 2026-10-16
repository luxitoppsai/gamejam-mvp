# PoC 2 - Jugador, roles y herramientas

Estado: Borrador

## Pregunta que responde
¿El cambio de rol por ítem y la dependencia entre roles es divertido y se entiende rápido?

## Mecánicas
M01 Movimiento y cámara, M02 Ítems y roles, M03 Agua y manguera, M09 Cortafuegos; M11-M13 si hay tiempo.

## Alcance
**Incluye:** movimiento top-down, tomar/soltar ítems, manguera con tanque, recarga por el Soporte, zanja de cortafuegos; hasta 4 jugadores en un teclado/gamepad, o 1 jugador más bots.
**Mockea:** el fuego (celdas que arden con regla fija) vía `FireModel`.

## Requisitos funcionales
- FR-2.1 Movimiento top-down con cámara que sigue al jugador local (M01) y colisión con tiles.
- FR-2.2 No hay roles fijos por persona: el rol lo determina el ítem en mano. Cualquier jugador puede tomar cualquier ítem, tomar uno asigna el rol y soltarlo permite cambiar (M02). Un ítem activo a la vez (hipótesis a validar).
- FR-2.3 Roles: Sofocador, Soporte de agua, Cortafuegos, Vigía, Botánico (ver `specs/mechanics-catalog.md`).
- FR-2.4 La manguera gasta agua de un tanque al disparar; sin agua no apaga (M03).
- FR-2.5 El Soporte recarga al Sofocador y se recarga en fuentes (M03).
- FR-2.6 El Cortafuegos abre zanjas que el fuego (mock) no puede cruzar (M09).
- FR-2.7 Las acciones se emiten como `PlayerCommand` (`extinguish`, `digFirebreak`, `water`, `swapItem`, `plant`).
- FR-2.8 Entrada por teclado y gamepad; hasta 4 locales, o 1 jugador + bots.
- FR-2.9 (opcional) Rescate de compañeros (M11), de comuneros/fauna (M12), Vigía con mapa de calor (M13).

## Requisitos no funcionales
- NFR-2.1 Tile 16x16, 320x224, `pixelArt: true`; física arcade simple.
- NFR-2.2 El rol se distingue por silueta y color de herramienta, no solo por texto.

## Criterios de aceptación
- AC-2.1 Un Sofocador sin Soporte se queda sin agua en pocos segundos; con Soporte puede seguir.
- AC-2.2 Una zanja bloquea el contagio del fuego mock.
- AC-2.3 3 personas ajenas al equipo entienden los roles sin explicación larga (anotar dónde se confunden).
- AC-2.4 Se valida la resolución de Q1: quien tiene semillas (Botánico) cambia a un ítem de combate y no queda inactivo; anotar si un ítem activo basta o hace falta un segundo espacio.
- AC-2.5 Demo corre con `npm run dev:roles`; README, GIF/video y métricas.

## Referencias
Valores en `specs/balance.md` (tanque, consumo, recarga, zanja).

## Riesgos y salida prevista
Si los roles confunden: reducir el MVP a 3 roles y reintroducir el resto por fases.

## Historial
- Borrador inicial a partir del documento técnico.