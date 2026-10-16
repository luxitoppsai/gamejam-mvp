# PoC 3 - Multijugador en línea

Estado: Borrador

## Pregunta que responde
¿Podemos sincronizar 4 jugadores y un estado de mapa compartido con servidor autoritativo y baja latencia percibida?

## Mecánicas
M19 Salas y lobby, M20 Sincronización, M21 Servidor autoritativo del fuego; M22 Reconexión y latencia si hay tiempo.

## Alcance
**Incluye:** servidor Node.js con Colyseus, sala de hasta 4 jugadores, sincronización de posiciones y de una cuadrícula simple de estados, ejecutada en el servidor con una regla de contagio sencilla.
**Mockea:** el fuego real (se reemplaza por el de la PoC 1 al integrar) y los roles.

## Requisitos funcionales
- FR-3.1 Crear o unirse a una sala de hasta 4 jugadores (M19).
- FR-3.2 El cliente envía `PlayerCommand`; el servidor los valida y aplica (autoritativo).
- FR-3.3 El servidor simula la cuadrícula con una regla de contagio sencilla; los clientes solo dibujan (M21).
- FR-3.4 Sincroniza posiciones de jugadores y estado de la cuadrícula (M20).
- FR-3.5 Cliente implementa `NetSession` (`send`, `onState`).
- FR-3.6 Cada estado incluye un checksum de la cuadrícula para verificación.
- FR-3.7 (opcional) Reconexión a la sala y compensación de latencia (M22).

## Requisitos no funcionales
- NFR-3.1 La regla de contagio vive en lógica pura sin dependencia de Phaser ni de Colyseus, para reutilizar `FireModel` de la PoC 1.
- NFR-3.2 Medir ancho de banda por jugador y latencia con una conexión comparable a la de un colegio.

## Criterios de aceptación
- AC-3.1 4 clientes de navegador estables durante 10 minutos.
- AC-3.2 La cuadrícula es idéntica en los 4 clientes (checksum coincide).
- AC-3.3 Ancho de banda por jugador y latencia medidos y anotados.
- AC-3.4 Demo corre con comandos documentados (servidor + clientes); README y métricas.

## Riesgos y salida prevista
Si la latencia se nota: enviar el fuego en ticks más espaciados e interpolar en el cliente; si no basta, lanzar primero con 2 jugadores.

## Historial
- Borrador inicial a partir del documento técnico.