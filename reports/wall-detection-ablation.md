# Ablación del pipeline de paredes

Un delta positivo al desactivar una etapa indica que esa etapa empeoró el promedio del dataset sintético. No implica generalización a fotografías.

| Etapa desactivada | IoU | Δ IoU | Boundary IoU | Δ Boundary | Leakage | Δ Leakage | Quality | Δ Quality |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| edgeAlignment | 0.9471 | 0.0012 | 0.8331 | 0.0030 | 0.00% | 0.00% | 93.58 | 0.09 |
| perspectiveCorrection | 0.9421 | -0.0038 | 0.8199 | -0.0103 | 0.00% | 0.00% | 93.15 | -0.34 |
| gapFilling | 0.9459 | 0.0000 | 0.8301 | 0.0000 | 0.00% | 0.00% | 93.49 | 0.00 |
| holeRemoval | 0.9459 | 0.0000 | 0.8301 | 0.0000 | 0.00% | 0.00% | 93.49 | 0.00 |
| noiseRemoval | 0.9459 | 0.0000 | 0.8301 | 0.0000 | 0.00% | 0.00% | 93.49 | 0.00 |
| boundaryOptimization | 0.9457 | -0.0002 | 0.8282 | -0.0020 | 0.00% | 0.00% | 93.25 | -0.24 |
| cornerSnap | 0.9442 | -0.0017 | 0.8241 | -0.0060 | 0.00% | 0.00% | 93.66 | 0.16 |
| polygonOptimization | 0.9483 | 0.0024 | 0.8365 | 0.0064 | 0.00% | 0.00% | 90.05 | -3.44 |
