# Benchmark del motor de pintura

Pipeline 1.3.0. Dataset sintético; no representa pintura física.

## Resumen

- ΔE medio en midtones: 2.59
- Error medio de matiz: 1.58°
- Preservación de luminancia: 98.70/100
- Preservación de textura: 87.32/100
- Estructura de sombras: 90.54/100
- Diferencia Borrador/Ultra: ΔE 0.051
- Diferencia preview Alta/export Ultra: ΔE 0.026
- Tiempo Borrador/Alta/Ultra en fixtures 96×64: 9.54 / 6.61 / 6.48 ms
- Tiempo combinado Alta+Ultra medio/máximo: 13.09 / 26.61 ms
- Canales recortados: 0

| Caso | Target | ΔE midtone | Hue ° | Luminancia | Textura | Sombras | Preview/export ΔE | Tiempo ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| beige-wall | #A8B5A2 | 0.32 | 2.59 | 100.0 | 100.0 | 80.0 | 0.000 | 26.61 |
| blue-wall | #C98276 | 1.13 | 1.76 | 100.0 | 100.0 | 80.0 | 0.000 | 11.40 |
| dark-gray-wall | #F5F1E8 | 6.42 | 2.90 | 100.0 | 100.0 | 80.0 | 0.000 | 13.30 |
| feather-mask | #B33A3A | 15.17 | 3.74 | 98.0 | 92.5 | 100.0 | 0.130 | 25.54 |
| flat-white-wall | #A8B5A2 | 2.46 | 1.32 | 100.0 | 100.0 | 80.0 | 0.000 | 10.32 |
| lateral-shadow | #A8B5A2 | 1.27 | 1.56 | 99.1 | 86.0 | 100.0 | 0.011 | 11.01 |
| light-gradient | #A8B5A2 | 0.54 | 1.71 | 98.8 | 22.3 | 97.0 | 0.004 | 9.21 |
| photo-noise | #A8B5A2 | 0.31 | 0.63 | 99.8 | 99.5 | 100.0 | 0.015 | 9.25 |
| room-corner | #A8B5A2 | 0.28 | 1.00 | 96.9 | 99.6 | 91.6 | 0.011 | 9.05 |
| subtle-texture | #B97A65 | 1.69 | 0.51 | 99.2 | 63.6 | 97.8 | 0.098 | 12.31 |
| white-reflection | #7E9BAF | 0.81 | 1.14 | 92.6 | 84.4 | 100.0 | 0.043 | 10.25 |
| yellow-wall | #A7BED3 | 0.69 | 0.15 | 100.0 | 100.0 | 80.0 | 0.000 | 8.86 |

## Rendimiento 1080p

- draft: 768×432, 341.6 ms, 7.0 MiB aproximados
- high: 1344×756, 828.6 ms, 21.3 MiB aproximados
- ultra: 1920×1080, 1635.8 ms, 43.5 MiB aproximados

## Controles

Intensidad (valor → ΔE): 0 → 4.50, 50 → 2.29, 100 → 0.32, 150 → 0.32, 200 → 0.35.

Imprimación (valor → ΔE): 0 → 1.08, 50 → 0.68, 100 → 0.32.

Los valores dependen de fixtures controlados, no de iluminación, pantalla, cámara, acabado o superficie reales.
