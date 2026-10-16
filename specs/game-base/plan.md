# Plan - Juego base

## Arquitectura

```
@vov/core      contratos (FireModel, PlayerCommand, constantes)
@vov/fire      CellularFire, WindController, vegetación  (sin Phaser)
@vov/gameplay  Arena, items/roles, Match (fases)          (sin Phaser)
@vov/view      tileset, WorldRenderer, ArenaView, InputSources (Phaser)
packages/game  PlayScene + HUD/minimapa/overlays en DOM   (Vite, puerto 5170)
```

Las PoC 1 y 2 usan las mismas librerías como bancos de prueba.

## Decisiones

- `Match` posee fuego, viento, arena y fases; la escena solo lee `Match` y dibuja. La entrada entra por `match.update(dt, inputs)`.
- La arena es genérica en el modelo de fuego (`Arena<F extends FireModel>`): fuego mock en PoC 2, `CellularFire` en el juego.
- El ritmo se ajusta a nivel de partida (`fireSpeed`, `extinguishScale`) sin tocar el autómata validado en la PoC 1.
- HUD, menú y resultado son DOM (texto nítido a cualquier escala); el mundo es Phaser a 320x224.
- Regeneración: un árbol adulto regenera su celda y las 4 vecinas (balance.md; por validar).

## Cómo seguir

1. Probar con personas y ajustar `matchParams.ts` (Q11).
2. Integrar la red (PoC 3): `Match` corre en el servidor, el cliente envía `PlayerCommand`.
3. Mapa Tiled, riego y audio por capas (resto de la PoC 4).
