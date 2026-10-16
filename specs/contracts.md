# Contratos entre módulos

Código: `packages/core/src`. Nombres y firmas son propuesta inicial; se fijan en el repo antes de empezar las PoC. Todo cambio aquí requiere avisar a las 4 PoC.

| Interfaz | Responsable | Archivo | Expone | Usan |
|----------|-------------|---------|--------|------|
| `FireModel` | PoC 1 | `fire.ts` | `step(dt)`, `getCell(x,y)`, `ignite(x,y)`, `extinguish(x,y,cantidad)`, `setWind(dirección,fuerza)`, `setFirebreak(x,y,on)`, `isFirebreak(x,y)` (Q8) | Servidor (PoC 3), dibujo del fuego |
| `TerrainGrid` | PoC 4 | `terrain.ts` | `get(x,y)`, `set(x,y,estado)`, evento de cambio | Fuego escribe `burned`; reforestación escribe `regenerated` |
| `PlayerCommand` | PoC 2 | `commands.ts` | `extinguish`, `digFirebreak`, `plant`, `water`, `swapItem`, `transferWater`, `refill` (Q9), `markZone` (Vigía) | La red los transporta; el servidor los aplica |
| `NetSession` | PoC 3 | `net.ts` | `send(comando)`, `onState(estado)` | Todos los módulos del cliente |

## Mocks esperados

| PoC | Mockea | Contra |
|-----|--------|--------|
| 1 | Jugadores, red | - |
| 2 | Fuego (regla fija) | `FireModel` |
| 3 | Fuego real, roles | `FireModel`, `PlayerCommand` |
| 4 | Fuego (mapa ya quemado), red | `FireModel`, `NetSession` |

## Reglas
- Una app (PoC o juego) nunca importa código de otra app. Comparte código solo mediante las librerías: `@vov/core` (contratos), `@vov/fire` (autómata del fuego), `@vov/gameplay` (arena, roles, partida; sin Phaser) y `@vov/view` (render Phaser: tileset, mundo, entidades, entrada).
- Cada interfaz se prueba con su mock y con el módulo real antes de integrar.