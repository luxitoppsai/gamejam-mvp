# PoC 2 - Jugador, roles y herramientas

**Pregunta:** ¿El cambio de rol por ítem y la dependencia entre roles es divertido y se entiende rápido?

Spec: `specs/poc-2-roles/`. Valores: `specs/balance.md` (sección PoC 2).

## Correr

```bash
npm install            # desde la raíz del monorepo
npm run dev:roles      # http://localhost:5172
npm test -w @vov/poc-roles
```

## Cómo se juega

No hay roles fijos por persona: **tu rol es el ítem que llevas** (decisión Q1). Cualquiera puede tomar cualquier ítem.

| Ítem | Rol | Qué hace |
|------|-----|----------|
| Manguera / Extintor | Sofocador | Mantén *usar*: rocía agua hacia donde miras y apaga fuego. El tanque se vacía (manguera ~7 s). |
| Mochila de agua | Soporte | Mantén *usar*: pasa agua al Sofocador cercano; si no hay, se recarga en una fuente (pozo azul). |
| Pala | Cortafuegos | Mantén *usar* frente a una celda ~1.5 s para abrir una zanja que el fuego no cruza. |
| Kit de semillas | Botánico | Mantén *usar* frente a una celda quemada (ceniza) para plantar un brote. |
| Radio | Vigía | Solo identifica el rol; su función (M13) es opcional y no está implementada. |

Para cambiar de rol: *tomar/soltar* sobre otro ítem (suelta el actual y toma el nuevo).

| Jugador | Mover | Tomar/soltar | Usar |
|---------|-------|--------------|------|
| J1 | WASD | E | F |
| J2 | Flechas | . | / |
| J3 | IJKL | U | O |
| Gamepad | stick / cruceta | A | X o B |

Botón "+ Jugador (teclado)" añade J2 y J3; un gamepad se une al pulsar cualquier botón (hasta 4 en total). `V` alterna vista completa. El fuego arranca en el extremo este.

## Qué hay

- `src/arena/Arena.ts`: lógica pura (sin Phaser): movimiento con colisión, tomar/soltar, agua, zanja, siembra; emite `PlayerCommand`.
- `src/mock/MockFireModel.ts`: fuego de regla fija que implementa `FireModel` (más `setFirebreak`, ver Q8).
- `src/roles/`: tabla de ítems -> rol y parámetros.
- `src/input/InputSources.ts`: teclado y gamepad.
- `src/render/` y `src/scenes/`: tilemap y sprites de pixel art con tiles de Kenney (`assets/reference`, CC0, solo referencia), llamas propias, panel HUD (`index.html`).

## Resultados

Pruebas automáticas (13, pasan): fuego mock determinista; **una zanja completa detiene el contagio** (AC-2.2); el rol cambia con el ítem y las semillas quedan en el suelo al cambiar a manguera (Q1); **un Sofocador sin Soporte se queda sin agua en menos de 8 s y con Soporte sigue rociando** (AC-2.1); la mochila solo se recarga en fuente; pala y semillas; colisiones; emisión de `PlayerCommand`.

Prueba manual en Edge con GPU (GTX 1660 SUPER), 2 jugadores: con Mochila cerca, la Manguera siguió al 100 % tras ~8 s de rociado mientras la mochila bajaba de 100 % a 61 %; zanja y siembra funcionan de punta a punta.

| Criterio | Estado |
|----------|--------|
| AC-2.1 Sofocador sin/con Soporte | Cumplido (pruebas + prueba manual) |
| AC-2.2 Zanja bloquea el fuego mock | Cumplido (prueba) |
| AC-2.3 3 personas ajenas entienden los roles | **Pendiente** (requiere prueba con personas) |
| AC-2.4 Botánico no queda inactivo | Resuelto por diseño (cambia a un ítem de combate); **pendiente validar** con jugadores si basta un ítem activo |
| AC-2.5 README, GIF/video y métricas | README y métricas listos; **falta GIF/video** |

## Hallazgos de contrato

- Q8: `FireModel` no define cortafuegos.
- Q9: `PlayerCommand` no define recargar/transferir agua.
- Q10: tileset y llamas duplicados con la PoC 1.

## Pendiente

- Prueba con 3 personas ajenas, anotando confusiones (T2.9).
- GIF o video corto (T2.11).
- Probar gamepad con hardware; bots; Vigía/rescates (opcionales).