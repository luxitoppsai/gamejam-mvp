# Plan - PoC 3

## Enfoque
Servidor Colyseus autoritativo con un `Room` de máximo 4 clientes. El estado sincronizado (posiciones + grid) se define en un esquema; la regla de contagio se inyecta como `FireModel` (simple ahora, el de PoC 1 después).

## Estructura
```
packages/poc-red/
  server/    (Node + Colyseus) rooms/GameRoom.ts, state schema, sim adapter
  src/       cliente Phaser: net/ColyseusSession.ts (implements NetSession), scenes/MainScene.ts
```
La carpeta `server/` se crea al iniciar T3.1 (agrega dependencias `colyseus` / `@colyseus/sdk` al paquete).

## Decisiones
- Servidor ejecuta la simulación; clientes envían solo comandos.
- Tick de simulación y tick de envío configurables (permite espaciar y interpolar).
- Checksum simple (p. ej. FNV-1a sobre el grid) incluido en cada snapshot.

## Pruebas y métricas
Prueba de 4 clientes 10 min (Playwright o clientes headless). Medir bytes/s por jugador y RTT; probar con red limitada (throttling).

## Trazabilidad
FR-3.1 -> T3.2; FR-3.2/3.3 -> T3.3-T3.4; FR-3.4/3.6 -> T3.5; FR-3.5 -> T3.6; AC-3.1..3.3 -> T3.8-T3.9.