# Plan - PoC 1

## Enfoque
Lógica de simulación pura en TypeScript (sin Phaser) en `packages/poc-fuego/src/sim/`; la escena Phaser solo lee `FireModel` y dibuja. Si es reutilizable por el servidor (PoC 3), mover a `@vov/core` al aprobar.

## Estructura
```
packages/poc-fuego/src/
  sim/        CellularFire.ts (implements FireModel), rng.ts (PRNG con semilla), params.ts (tablas de vegetación)
  render/     FireRenderer.ts (tiles + partículas)
  scenes/     MainScene.ts, DebugPanel
  main.ts
```

## Decisiones
- Grid en arrays tipados (`Uint8Array`) para rendimiento y checksum barato.
- Paso fijo de simulación desacoplado del frame de dibujo (permite bajar la frecuencia).
- PRNG determinista (mulberry32 o similar), semilla inyectada.
- Probabilidad de contagio = base(vegetación) * factor de viento según ángulo vecino->origen.

## Pruebas y métricas
Vitest sobre `sim/` (determinismo, contagio, viento). Métricas: FPS medio/mín en 64x64 y 128x128, ms por `step`.

## Trazabilidad
FR-1.1..1.5 -> T1.2-T1.5 -> pruebas unitarias; FR-1.6 -> T1.6-T1.7; AC-1.1 -> T1.8.