# Plan - PoC 4

## Enfoque
`TerrainGrid` como lógica pura (arrays tipados + eventos), independiente de Phaser. La escena renderiza el tilemap de Tiled y reacciona al evento de cambio actualizando solo los tiles afectados. Una máquina de estados pura gobierna las fases.

## Estructura
```
packages/poc-terreno/src/
  terrain/    TerrainGridImpl.ts, growth.ts (etapas por especie)
  flow/       PhaseMachine.ts (preparación, combate, reforestación, cierre)
  hud/        Hud.ts, Minimap.ts
  audio/      LayeredMusic.ts
  scenes/     MainScene.ts
public/maps/  mapa.tmj (Tiled)
```

## Decisiones
- Actualización incremental de tiles (no re-render completo) para sostener FPS con 10 000+ tiles.
- Crecimiento por etapas definido en datos por especie.
- Mock de fuego: mapa inicial con celdas `burned` precargadas.
- Audio: capas sincronizadas que suben/bajan volumen según variable.

## Pruebas y métricas
Vitest sobre `TerrainGridImpl` y `PhaseMachine`. Métricas: FPS durante la transición gris->verde, tiempo de carga.

## Trazabilidad
FR-4.1 -> T4.1; FR-4.2 -> T4.2; FR-4.3/4.4 -> T4.3-T4.4; FR-4.5 -> T4.5; FR-4.6 -> T4.6; FR-4.7 -> T4.7.