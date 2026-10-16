# Constitución del proyecto

## Visión
Juego cooperativo de acción top-down para 4 jugadores: una brigada comunitaria apaga un incendio forestal en Perú y reforesta lo quemado. Ritmo arcade y humor de serie B (referencia: Zombies Ate My Neighbors), con fuego que se propaga en lugar de zombis.

## Pilares (si una mecánica no sirve a ninguno, se descarta)
1. **Diversión primero.** Acción inmediata, partidas de 10-15 min por nivel (por validar), jugable sin explicación larga.
2. **El mensaje vive en las mecánicas.** Causas visibles del fuego y decisiones reales de reforestación; sin pantallas de texto sermoneadoras.
3. **Cooperación obligada.** Ningún rol gana solo.
4. **Modularidad.** Cada sistema es un módulo con contrato claro, probado solo antes de integrarse.

## Stack
Phaser 3, TypeScript (strict), Vite, Vitest. Servidor de PoC 3: Node.js + Colyseus. Navegador de escritorio y Chromebook.

## Reglas técnicas no negociables
- Resolución base 320x224, tile 16x16, `pixelArt: true`, escalado por múltiplos enteros.
- Simulación (fuego, terreno) = lógica pura, determinista, sin Phaser; servidor autoritativo del fuego.
- Los módulos hablan solo por interfaces de `@vov/core` y usan mocks para lo ajeno.
- Entregable por PoC: demo con un comando, README, GIF/video corto, tabla de métricas.
- Tiempo fijo por PoC: **2 días** (2026-10-16 a 2026-10-18), con revisión conjunta al final. Solo mecánicas MVP; las opcionales solo si sobra tiempo.
- Repositorio: **monorepo único**. Valores numéricos en `specs/balance.md`.

## Contenido
- Arte, personajes y logotipos originales (solo la estética general de ZAMN). **Excepción provisional:** en las PoC se permite arte de referencia con licencia libre verificada (Kenney, CC0) guardado en `assets/reference/`; no es arte final. Audio original o licencia libre verificada, OGG.
- Datos ecológicos: ejemplos hasta validar con especialistas forestales.
- Voces opcionales en prototipo; se sustituyen por texto con blip.

## Definición de terminado (por PoC)
Cumple todos sus `AC-*`; métricas medidas y anotadas; interfaz probada con su mock; README; sin dependencias directas de otras PoC.

## Integración (orden)
PoC1+PoC4 -> +PoC2 -> +PoC3 -> prueba de juego externa (3+ personas ajenas).

## Alcance MVP
Un nivel de punta a punta: una región, fuego con viento, dos vegetaciones, cuatro roles básicos, una especie, flujo preparación -> combate -> reforestación -> cierre.