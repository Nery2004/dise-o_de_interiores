# Rendimiento del editor

Medición 2026-07-13T02:39:28.991Z. Entorno Node v25.2.1; los FPS son proxies CPU y no sustituyen un navegador real.

## Pipeline

- Pintura 1080p p50/p95: 1713.613 / 1728.192 ms
- Exportación PNG 1080p p50/p95: 1732.931 / 1743.295 ms
- Memoria estimada preview 6000×4000 automático: 43.6 MiB (1625×1083)
- Historial sintético: 0.88 MiB

## Interacción CPU

| Ruta | p50 ms | p95 ms | máximo ms |
|---|---:|---:|---:|
| objectDrag | 0.004 | 0.016 | 0.454 |
| maskEditing | 0.04 | 0.046 | 0.207 |
| zoomPan | 0.001 | 0.002 | 0.117 |
| slider | 0 | 0 | 0.026 |
| comparator | 0.001 | 0.001 | 0.054 |
| brush | 0.001 | 0.001 | 0.078 |
| colorChange | 0.001 | 0.002 | 0.064 |

## Bundle

- Landing: 45.0 KiB (6 chunks)
- Editor: 725.7 KiB (13 chunks)
- JS estático total: 1686.7 KiB

Los tiempos varían por CPU, carga y JIT. Lighthouse/Core Web Vitals requieren Chrome real y se registran por separado.
