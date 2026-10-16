# Plan - PoC 2

## Enfoque
Lógica de roles/ítems separada de la escena: `RoleSystem` decide capacidades según el ítem y emite `PlayerCommand`; la escena Phaser solo traduce entrada y dibuja. El fuego es un `MockFireModel` que implementa `FireModel` con una regla fija.

## Estructura
```
packages/poc-roles/src/
  mock/       MockFireModel.ts (implements FireModel)
  roles/      items.ts, RoleSystem.ts, WaterTank.ts
  input/      InputMap.ts (teclado y gamepad), Bot.ts
  scenes/     MainScene.ts
```

## Decisiones
- Tabla de ítems -> rol en datos (`items.ts`), no en condicionales.
- Cada jugador tiene `PlayerState { role, item, water }`; los comandos son datos serializables (listos para PoC 3).
- Arcade physics + colisión con tilemap simple.

## Pruebas
Vitest sobre `RoleSystem`/`WaterTank`. Prueba de juego con 3 personas ajenas; registrar confusiones.

## Trazabilidad
FR-2.2/2.3 -> T2.3; FR-2.4/2.5 -> T2.4-T2.5; FR-2.6 -> T2.6; AC-2.3/2.4 -> T2.9.