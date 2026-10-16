# PoC 1 - Simulación del fuego

**Pregunta:** ¿Se puede simular un incendio legible, con viento y vegetación, a 60 FPS y de forma determinista?

**Criterio de éxito:** 60 FPS en 64x64 y 128x128; el viento cambia el patrón; misma semilla = mismo resultado.

Spec: `specs/poc-1-fuego/` (spec, plan, tareas). Valores: `specs/balance.md`.

## Correr

```bash
npm install            # desde la raíz del monorepo
npm run dev:fuego      # http://localhost:5171
npm test -w @vov/poc-fuego
```

La cámara arranca a zoom 0.5 (40 x 28 tiles visibles); el botón Zoom y la rueda recorren 0.25, 0.5, 1 y vista completa.

Controles: clic = encender celda, clic derecho = apagar (radio 3), WASD/flechas = cámara, rueda o Z = zoom, Espacio = pausa. Panel lateral: reiniciar, nueva semilla, 64x64/128x128, velocidad, viento (rotar, fuerza, auto-viento), encender centro/8 focos. Viento: 0 grados = este, 90 = sur.

## Qué hay

- `src/sim/` lógica pura (sin Phaser, sin `Math.random()`): `CellularFire` implementa `FireModel` de `@vov/core`; `WindController`; PRNG con semilla; vegetación generada por ruido.
- `src/render/`: tilemap de pixel art de 16x16. `tileset.ts` compone el tileset con tiles de Kenney (`assets/reference`, CC0, solo referencia) más llamas y ceniza generadas con contorno oscuro; `FireRenderer.ts` cambia el tile de cada celda entre vivo (pasto, arbusto, pino), ardiendo (llama animada) y quemado (ceniza, troncos), y añade humo y chispas con partículas.
- `src/scenes/MainScene.ts` y `index.html`: escena, cámara y panel de depuración.

## Métricas

Entorno: Windows 11, Microsoft Edge headless vía Playwright **con render por software (SwiftShader, sin GPU)**. Es un entorno pesimista para el dibujo, pero no es una laptop real: **AC-1.1 queda pendiente de confirmar en una laptop modesta**.

Prueba: 8 focos, velocidad x4, 25 s de muestreo (se descartan los primeros 1 s).

| Mapa | FPS medio | FPS mín | Paso de sim (medio / máx) | Dibujo (medio / máx) | Celdas ardiendo (máx) |
|------|-----------|---------|---------------------------|----------------------|-----------------------|
| 128 x 128 | 104.8 | 66 | 0.20 ms / 1.14 ms | 0.34 ms / 0.68 ms | 5261 |
| 64 x 64 | 131.2 | 108 | 0.07 ms / 0.28 ms | 0.27 ms / 0.64 ms | 1779 |

La simulación corre a 10 pasos/s, así que consume ~0.2 ms por paso de un presupuesto de 100 ms.

Velocidad del frente (celdas/s, mapa uniforme, medida en pruebas): pastizal ~2.1, matorral ~1.2, bosque ~0.55 sin viento; con viento fuerte a favor ~3.3 / ~1.9 / ~0.9.

Determinismo: `npm test` comprueba que la misma semilla da el mismo checksum en dos ejecuciones y que semillas distintas difieren (10 pruebas).

## Pendiente

- GIF o video corto de la demo (T1.11).
- Confirmar 60 FPS en una laptop modesta (AC-1.1).
- Opcional: pendiente M08 (T1.10).