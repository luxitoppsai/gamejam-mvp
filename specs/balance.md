# Valores de balance (iniciales)

Fuente única de los números del juego. Todos son **puntos de partida** a ajustar en pruebas de juego; si cambias uno, edítalo aquí y no en el código disperso.

## Mapa y simulación
| Parámetro | Valor |
|-----------|-------|
| Mapa del nivel MVP | 128 x 128 tiles (16 384 tiles; cumple >= 10 000 de la PoC 4) |
| Benchmarks de la PoC 1 | 64 x 64 y 128 x 128 |
| Grid de fuego | 1 celda = 1 tile (16 x 16 px) |
| Frecuencia de simulación | 10 pasos/s (desacoplada del dibujo) |
| Semilla por defecto | 1337 |

## Fuego
| Parámetro | Valor |
|-----------|-------|
| Prob. de contagio por paso a vecino (8 vecinos): pastizal / matorral / bosque | 0.05 / 0.026 / 0.011 |
| Duración de una celda ardiendo (pasos): pastizal / matorral / bosque | 40 / 80 / 200 |
| Velocidad del frente resultante, sin viento (celdas/s) | ~2.1 / ~1.2 / ~0.55 (medida en PoC 1; con viento fuerte a favor ~3.3 / ~1.9 / ~0.9) |
| Multiplicador de viento sobre el contagio | 0.5 (en contra) a 2.0 (a favor) |
| Cambio de viento | cada 20-40 s, giro máx. 45 grados |
| Pendiente (M08, opcional) | x1.5 cuesta arriba |

> Reajuste 2026-10-16: los primeros valores (contagio 0.60/0.35/0.15, duración 15/30/60) daban 5-10 celdas/s y el mapa de 128 se quemaba en ~20 s. Los actuales dan un frente de 0.5-2 celdas/s.

## Resultado del nivel
| Parámetro | Valor |
|-----------|-------|
| Derrota en combate | fuego supera 70% del bosque, o caen los 4 jugadores |
| Paso a reforestación | sin focos activos y quemado < 70% |
| Meta de regeneración (victoria) | 50% de las celdas quemadas en estado `regenerated` |

## Tiempos (objetivo total 10-15 min)
| Fase | Valor |
|------|-------|
| Preparación | <= 45 s |
| Combate | sin tope; termina por victoria parcial o derrota (esperado 5-7 min) |
| Reforestación (ventana de siembra) | 300 s |
| Cierre | ~30 s |

## Jugador y herramientas
| Parámetro | Valor |
|-----------|-------|
| Jugadores | PoC 2: hasta 4 locales (o 1 + bots); juego final: 4 en línea |
| Tanque de agua | capacidad 100 |
| Consumo de la manguera | 15/s (se vacía en ~7 s) |
| Recarga: Soporte -> Sofocador / fuente natural -> Soporte | 40/s / 25/s |
| Cavar zanja | 1.5 s por celda, 1 celda de ancho |
| Ítems activos por jugador | 1 |

## Reforestación
| Parámetro | Valor |
|-----------|-------|
| Etapas de crecimiento | 3 (semilla -> brote -> árbol) |
| Tiempo por etapa (una especie, con riego) | 20 s; sin riego se detiene |