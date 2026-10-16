# Specs - Verde Otra Vez

Desarrollo guiado por especificaciones: **spec -> plan -> tasks -> código**. La spec dice *qué y por qué*, el plan *cómo*, las tareas *en qué orden*.

## Índice

| Documento | Contenido |
|-----------|-----------|
| [constitution.md](constitution.md) | Principios, stack y reglas no negociables |
| [mechanics-catalog.md](mechanics-catalog.md) | Las 25 mecánicas (M01-M25), dependencias y prioridad |
| [contracts.md](contracts.md) | Interfaces entre módulos |
| [open-questions.md](open-questions.md) | Decisiones pendientes y supuestos |
| [poc-1-fuego/](poc-1-fuego/) | Simulación del fuego |
| [poc-2-roles/](poc-2-roles/) | Jugador, roles y herramientas |
| [poc-3-red/](poc-3-red/) | Multijugador en línea |
| [poc-4-terreno/](poc-4-terreno/) | Reforestación, terreno y presentación |
| [_templates/](_templates/) | Plantillas para specs nuevas |

## Estado

| PoC | Spec | Plan | Tareas | Responsable |
|-----|------|------|--------|-------------|
| 1 Fuego | Borrador | Borrador | 0% | por asignar |
| 2 Roles | Borrador | Borrador | 0% | por asignar |
| 3 Red | Borrador | Borrador | 0% | por asignar |
| 4 Terreno | Borrador | Borrador | 0% | por asignar |

Estados: Borrador -> Revisada -> Aprobada. Una spec Aprobada solo cambia con nota en el historial de su archivo.

## Convenciones

- IDs: `FR-<poc>.<n>` requisito funcional, `NFR-<poc>.<n>` no funcional, `AC-<poc>.<n>` criterio de aceptación, `T<poc>.<n>` tarea.
- Los valores numéricos son puntos de partida a ajustar en pruebas de juego (marcados "inicial").