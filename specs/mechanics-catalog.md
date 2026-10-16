# Catálogo de mecánicas

Prioridad: MVP = mínimo para validar diversión; Fase 2/3 amplían después.

| ID | Mecánica | Qué hace | Depende de | Prioridad | PoC |
|----|----------|----------|-----------|-----------|-----|
| M01 | Movimiento y cámara | Jugador top-down; la cámara lo sigue | - | MVP | 2 |
| M02 | Ítems y roles dinámicos | Tomar/soltar ítem cambia el rol | M01 | MVP | 2 |
| M03 | Agua y manguera | Tanque que se vacía y se recarga en fuentes o por el Soporte | M02 | MVP | 2 |
| M04 | Resistencia, humo y calor | El humo reduce visión; el calor baja resistencia | M01, M05 | Fase 2 | 2 |
| M05 | Propagación del fuego | Autómata celular: cada celda arde, se apaga o contagia | - | MVP | 1 |
| M06 | Viento | Dirección y fuerza que sesgan la propagación y cambian | M05 | MVP | 1 |
| M07 | Tipos de vegetación | Pastizal arde rápido, bosque húmedo lento | M05 | MVP | 1 |
| M08 | Pendiente | El fuego sube más rápido cuesta arriba | M05 | Fase 2 | 1 |
| M09 | Cortafuegos | Zanja que el fuego no cruza | M05, M02 | MVP | 2 |
| M10 | Focos secundarios y causas | Chispas y NPC imprudentes crean focos y enseñan la causa | M05 | Fase 2 | 1 |
| M11 | Rescate de compañeros | Un jugador caído es levantado por otro | M01 | Fase 2 | 2 |
| M12 | Rescate de comuneros y fauna | Objetivos secundarios con puntaje | M01, M05 | Fase 2 | 2 |
| M13 | Rol Vigía | Ve mapa de calor y marca zonas de riesgo | M02, M05 | Fase 2 | 2 (implementado en el juego base: radio, dron y marcas) |
| M14 | Estados del terreno | Celda: bosque vivo, quemada o regenerada | - | MVP | 4 |
| M15 | Reforestación | Cavar, plantar, regar, esperar crecimiento; especies con distinto ritmo | M14, M02 | MVP (una especie) | 4 |
| M16 | Flujo de fases y victoria/derrota | Controla preparación, combate, reforestación y cierre | M14 | MVP | 4 |
| M17 | HUD y minimapa | Agua, resistencia, viento, % quemado, rol | M03, M06, M14 | MVP | 4 |
| M18 | Audio dinámico | Capas de música según % quemado y peligro | M16 | Fase 2 | 4 |
| M19 | Salas y lobby | Crear o unirse a sala de hasta 4 | - | MVP | 3 |
| M20 | Sincronización | Posiciones y estado del mapa iguales | M19 | MVP | 3 |
| M21 | Servidor autoritativo del fuego | Servidor ejecuta M05; clientes dibujan | M05, M20 | MVP | 3 |
| M22 | Reconexión y latencia | Reentrada a la sala y compensación de retardo | M20 | Fase 3 | 3 |
| M23 | Progresión entre partidas | Mejoras de equipo y herramientas | M02, M16 | Fase 3 | 4 |
| M24 | Campaña y eventos | Regiones encadenadas; tormenta seca, quema ilegal | M16, M07 | Fase 3 | 4 |
| M25 | Cierre educativo | Pantalla final con dato real y bosque creciendo | M16 | Fase 3 | 4 |

## Roles por ítem (M02)

El rol no es fijo por persona: lo da el ítem que se sostiene. Cualquier jugador puede tomar cualquier ítem y cambiar soltándolo.

| Rol | Ítems | Función | Necesita de |
|-----|-------|---------|-------------|
| Sofocador | Manguera, extintor, machete | Apaga fuego directo y frena el avance | Agua del Soporte |
| Soporte de agua | Bomba manual, mochila | Recarga al Sofocador en fuentes naturales | Acceso a una fuente cercana |
| Cortafuegos | Pala, pico, rastrillo | Abre zanjas y cava hoyos para sembrar | Información del Vigía |
| Botánico | Kit de semillas y fertilizante | Planta y acelera crecimiento en reforestación | Hoyos del Cortafuegos y agua del Soporte |
| Vigía | Dron, radio, mapa de calor | Ve viento y zonas de riesgo y las marca | El equipo actúa según sus avisos |

## Reglas de resultado (valores iniciales)

| Resultado | Condición |
|-----------|-----------|
| Derrota en combate | Fuego supera 70% del bosque, o los 4 jugadores caen sin rescate posible |
| Paso a reforestación | Sin focos activos y bosque quemado bajo el límite |
| Derrota en reforestación | Se acaba la ventana de siembra sin cumplir la meta de regeneración |
| Victoria | Se alcanza la meta de regeneración; puntaje = bosque salvado + recuperado + rescates |