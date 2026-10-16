# PoC 1 - Simulación del fuego

Estado: Borrador

## Pregunta que responde
¿Se puede simular un incendio legible, con viento y vegetación, a 60 FPS en una laptop modesta y de forma determinista?

## Mecánicas
M05 Propagación, M06 Viento, M07 Tipos de vegetación; M08 Pendiente si hay tiempo.

## Alcance
**Incluye:** cuadrícula con autómata celular, viento variable, 2-3 tipos de vegetación, render simple de llamas y ceniza, botones de depuración para encender/apagar celdas.
**Mockea:** jugadores y red.

## Requisitos funcionales
- FR-1.1 Cada celda tiene estado `unburned | burning | burned` y una vegetación (`grass | shrub | forest`).
- FR-1.2 Una celda en llamas contagia a vecinas según tipo de vegetación (pastizal rápido, bosque lento).
- FR-1.3 El viento (dirección, fuerza) sesga el contagio y cambia durante la simulación.
- FR-1.4 Implementa `FireModel` de `@vov/core`: `step`, `getCell`, `ignite`, `extinguish`, `setWind`.
- FR-1.5 `extinguish(x,y,cantidad)` reduce la intensidad de la celda; a 0 se apaga.
- FR-1.6 El render muestra llamas animadas (tiles + partículas por vegetación) y ceniza; panel de depuración para encender/apagar celdas.
- FR-1.7 (opcional) Pendiente: el fuego sube más rápido cuesta arriba (M08).

## Requisitos no funcionales
- NFR-1.1 La simulación no importa Phaser ni usa `Math.random()`/`Date.now()`; usa PRNG con semilla.
- NFR-1.2 Mapas de 64x64 y 128x128 celdas.
- NFR-1.3 Tile 16x16, 320x224, `pixelArt: true`.

## Criterios de aceptación
- AC-1.1 60 FPS estables en 64x64 y 128x128 en una laptop modesta (medir FPS medio y mínimo).
- AC-1.2 Cambiar el viento cambia visiblemente el patrón de propagación (comparación con la misma semilla).
- AC-1.3 Misma semilla => estado idéntico en dos ejecuciones (prueba automática con checksum tras N pasos).
- AC-1.4 Pruebas unitarias de contagio, viento y vegetación pasan.
- AC-1.5 Demo corre con `npm run dev:fuego`; README y GIF/video entregados; métricas anotadas.

## Riesgos y salida prevista
Si no llega a 60 FPS: reducir la cuadrícula, simular a menor frecuencia que el dibujo, o mover el cálculo a un Web Worker.

## Historial
- Borrador inicial a partir del documento técnico.