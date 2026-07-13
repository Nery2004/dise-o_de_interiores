# Benchmark de detección de paredes

Pipeline 2.1.6; provider detallado: `recorded`. Dataset sintético: estos números no representan precisión sobre fotografías reales.

## Resumen global

- IoU: 0.9459
- Dice: 0.9721
- Precision: 0.9602
- Recall: 0.9847
- Boundary IoU (3 px): 0.8301
- Leakage de exclusiones: 0.00%
- Quality score medido: 93.49/100
- Tiempo promedio/p50/p95/máximo: 217.5 / 221.9 / 306.3 / 306.3 ms
- Mejor caso: strong-light
- Peor caso: wall-with-columns

## Resultado por caso

| Caso | Dificultad | IoU crudo | IoU final | Boundary IoU | Leakage | Quality | Tiempo ms | Errores |
|---|---|---:|---:|---:|---:|---:|---:|---|
| clean-front-wall | easy | 0.953 | 0.956 | 0.829 | 0.00% | 95.3 | 221.9 | — |
| dark-wall | hard | 0.910 | 0.938 | 0.756 | 0.00% | 92.0 | 185.7 | — |
| multiple-walls | hard | 0.968 | 0.943 | 0.712 | 0.00% | 90.5 | 262.0 | fragmented-mask |
| partially-occluded-wall | hard | 0.694 | 0.965 | 0.886 | 0.00% | 95.4 | 207.7 | — |
| side-wall | medium | 0.954 | 0.937 | 0.810 | 0.00% | 93.6 | 128.7 | — |
| strong-light | hard | 0.974 | 0.985 | 0.937 | 0.00% | 97.3 | 146.1 | — |
| wall-with-columns | hard | 0.942 | 0.890 | 0.708 | 0.00% | 85.8 | 306.3 | fragmented-mask |
| wall-with-curtain | hard | 0.646 | 0.940 | 0.907 | 0.00% | 92.7 | 263.3 | fragmented-mask |
| wall-with-door | medium | 0.792 | 0.975 | 0.929 | 0.00% | 97.2 | 227.0 | — |
| wall-with-pictures | medium | 0.854 | 0.941 | 0.851 | 0.00% | 93.6 | 239.4 | — |
| wall-with-shadows | hard | 0.955 | 0.957 | 0.830 | 0.00% | 95.4 | 191.8 | — |
| wall-with-sofa | medium | 0.754 | 0.958 | 0.882 | 0.00% | 95.7 | 211.4 | — |
| wall-with-television | medium | 0.811 | 0.927 | 0.816 | 0.00% | 91.7 | 256.6 | fragmented-mask |
| wall-with-window | medium | 0.819 | 0.939 | 0.843 | 0.00% | 92.8 | 233.5 | — |
| white-wall | easy | 0.955 | 0.938 | 0.756 | 0.00% | 93.3 | 180.8 | — |

## Providers

| Modo | Estado | IoU | Quality |
|---|---|---:|---:|
| recorded | salida pregrabada | 0.9459 | 93.49 |
| mock | mock sintético; no detecta la imagen | 0.7745 | 80.66 |
| backend-mock | mock sintético; no detecta la imagen | 0.7745 | 80.66 |
| configured | no ejecutado: providers externos placeholder | — | — |
| withoutRefinement | pipeline sin etapas | 0.9539 | 94.54 |
| withRefinement | pipeline completo | 0.9459 | 93.49 |

## Threshold y morfología

Las predicciones pregrabadas son binarias; por ello los thresholds 0.3–0.7 producen el mismo resultado y no justifican elegir 0.5 por mejora medida. La comparación morfológica está en el JSON.

## Limitaciones

El dataset es geométrico, pequeño y sintético. Los providers externos son placeholders y no fueron llamados. Los tiempos corresponden a fixtures de 96×64 px y no validan por sí solos el objetivo de 1080p.
