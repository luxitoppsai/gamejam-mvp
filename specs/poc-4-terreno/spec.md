# PoC 4 - Reforestación, terreno y presentación

Estado: Borrador

## Pregunta que responde
¿El paso de ceniza a verde es una recompensa visible y la reforestación es entretenida por sí sola?

## Mecánicas
M14 Estados del terreno, M15 Reforestación, M16 Flujo de fases y victoria/derrota, M17 HUD y minimapa; M18 Audio dinámico si hay tiempo.

## Alcance
**Incluye:** mapa cargado desde Tiled con capas, estados del terreno (vivo, quemado, regenerado), plantar y regar con crecimiento por etapas, HUD básico, máquina de estados de las fases y audio por capas con 2-3 pistas.
**Mockea:** el fuego (un mapa ya quemado) y la red.

## Requisitos funcionales
- FR-4.1 Carga de mapa Tiled (capas) en Phaser.
- FR-4.2 Implementa `TerrainGrid` de `@vov/core` con estados `alive | burned | regenerated` y evento de cambio (M14).
- FR-4.3 Cavar, plantar y regar; el crecimiento avanza por etapas; una especie en el MVP, con ritmo propio (M15).
- FR-4.4 Cambio visual gradual gris -> verde, visible desde el inicio de la reforestación; la saturación crece con lo plantado.
- FR-4.5 Máquina de estados: preparación -> combate -> reforestación -> cierre, con reglas de victoria/derrota (M16).
- FR-4.6 HUD: agua, resistencia, flecha de viento, % quemado, rol; minimapa (M17).
- FR-4.7 Audio por capas (base, tensión, peligro) según una variable del juego, p. ej. % quemado (M18).
- FR-4.8 (Fase 3) Cierre educativo con dato real y bosque creciendo (M25).

## Requisitos no funcionales
- NFR-4.1 Mapas de >= 10 000 tiles sin caídas de FPS.
- NFR-4.2 Audio en OGG comprimido; originales o licencia libre verificada.
- NFR-4.3 Datos ecológicos son ejemplos hasta validación con especialistas.

## Criterios de aceptación
- AC-4.1 Un mapa de >= 10 000 tiles pasa de gris a verde sin caídas de FPS.
- AC-4.2 El cambio de fase funciona de punta a punta.
- AC-4.3 La música cambia de capa según una variable del juego.
- AC-4.4 Prueba con jugadores: la reforestación entretiene sola (anotar observaciones).
- AC-4.5 Demo corre con `npm run dev:terreno`; README, GIF/video y métricas.

## Referencias
Valores en `specs/balance.md` (mapa 128x128, tiempos de fase, meta de regeneración, etapas de crecimiento).

## Riesgos y salida prevista
Si la reforestación aburre: añadir decisiones (qué especie, dónde) o acortar la fase.

## Historial
- Borrador inicial a partir del documento técnico.