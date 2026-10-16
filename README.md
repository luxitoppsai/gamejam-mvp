# Verde Otra Vez - PoC

Monorepo de las 4 pruebas de concepto descritas en `Verde Otra Vez Documento técnico de diseño.pdf`.

Stack común: Phaser 3 + TypeScript + Vite. Tile 16x16, resolución base 320x224.

| Paquete | PoC | Mecánicas | Responsable |
|---------|-----|-----------|-------------|
| `packages/core` | Interfaces y lógica pura (sin Phaser) | - | equipo |
| `packages/poc-fuego` | 1 - Simulación del fuego | M05, M06, M07 (M08) | por asignar |
| `packages/poc-roles` | 2 - Jugador, roles y herramientas | M01, M02, M03, M09 | por asignar |
| `packages/poc-red` | 3 - Multijugador en línea (Colyseus) | M19, M20, M21 (M22) | por asignar |
| `packages/poc-terreno` | 4 - Reforestación, terreno y presentación | M14-M17 (M18) | por asignar |

## Especificaciones (SDD)

El proyecto sigue Spec-Driven Development: **spec -> plan -> tasks -> código**. Empieza por [specs/README.md](specs/README.md) y [AGENTS.md](AGENTS.md) (guía para LLMs y colaboradores).

## Uso

```bash
npm install
npm run dev:fuego      # o dev:roles, dev:red, dev:terreno
npm run typecheck
npm test
```

## Reglas

- Los módulos solo se conectan a través de las interfaces de `@vov/core` (`FireModel`, `TerrainGrid`, `PlayerCommand`, `NetSession`); lo que no es de la PoC se mockea.
- `core` no depende de Phaser: la simulación debe correr igual en servidor y en pruebas.
- Cada PoC entrega: demo con un comando, README, GIF/video corto y tabla de métricas.
