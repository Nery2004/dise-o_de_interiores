# Auditoría de detección y refinamiento de paredes

Fecha de auditoría inicial: 2026-07-12. Este documento separa hechos verificados en código, hipótesis que requieren benchmark y resultados medidos. El dataset inicial será sintético y no sustituirá una evaluación con habitaciones reales etiquetadas.

## Arquitectura actual

1. `POST /api/detect-walls` valida formato, tamaño y dimensiones de la imagen.
2. Selecciona un `WallSegmentationProvider` y calcula un raster de trabajo con lado máximo de 512 px.
3. El provider debe devolver regiones con `BinaryMask`; la interfaz actual no acepta probabilidades por píxel.
4. En paralelo, `ImageEdgeAnalyzer` genera luminancia, Sobel y un umbral de borde.
5. `PerspectiveAnalyzer` estima líneas mediante una transformada de Hough reducida.
6. `WallRefinementPipeline` ejecuta edge alignment, corrección de perspectiva, cierre de huecos, relleno de agujeros pequeños, limpieza de ruido, optimización de borde, corner snap y simplificación poligonal.
7. `ContourExtractor` toma el loop exterior de mayor área; `PolygonOptimizer` simplifica y el polígono se rasteriza otra vez como máscara final.
8. El resultado se escala a coordenadas de la imagen original y se convierte a `WallDetectionResult`.
9. En desarrollo, la API puede devolver RLE de cuatro snapshots: original, cleaned, corrected y final.
10. En cliente, un worker adicional vuelve a simplificar los polígonos recibidos.

## Providers disponibles

| Provider | Estado verificado | Observación |
|---|---|---|
| `mock` del servidor | Funcional, sintético | Ignora la imagen y siempre genera tres polígonos normalizados. No mide detección real. Sus IDs eran aleatorios, lo que impide reproducibilidad exacta. |
| `mock` del cliente | Implementado pero no usado por `detectWalls()` | También genera tres paredes fijas; no participa en el flujo actual de API. |
| `replicate` | Placeholder | Comprueba token, pero no tiene model ID ni llamada externa. |
| `huggingface` | Placeholder | Comprueba token, pero no tiene endpoint/modelo ni llamada externa. |
| `roboflow` | Placeholder | Comprueba API key, pero no tiene proyecto/versión ni llamada externa. |
| `sam2`, `florence-2`, `grounding-dino`, `yolo-segmentation` | Placeholder | Devuelven explícitamente “no configurado”. |
| `custom` | Solo refinamiento local | Rasteriza el polígono enviado; no es un modelo ni un provider de segmentación general. |
| `ai` | Alias de configuración | Por defecto resuelve a `mock`; no implica IA real. |

No se ejecutarán servicios externos durante tests o benchmarks normales. Cualquier ejecución externa futura requerirá `RUN_EXTERNAL_WALL_AI=true` y un provider realmente implementado.

## Módulos activos

- API: validación, rate limit, timeout combinado, cancelación por `AbortSignal` y caché LRU/TTL en memoria.
- Pipeline principal: `ImageEdgeAnalyzer`, `PerspectiveAnalyzer`, `WallRefinementPipeline`, `ContourExtractor` y `PolygonOptimizer`.
- Refinamiento: `EdgeAligner`, `PerspectiveCorrector`, `GapFiller`, `HoleRemover`, `NoiseCleaner`, `WallBoundaryOptimizer`, `CornerSnapper` y optimización poligonal.
- Debug de desarrollo: máscaras RLE por etapa, contorno, polígono, score heurístico, alertas y tiempos de refinamiento.
- Worker cliente: simplificación poligonal posterior a la respuesta de API.

## Módulos no conectados o parciales

- `BinaryMaskProcessor`, `WallRefiner` y `GeometryOptimizer` tienen pruebas o implementaciones, pero no forman parte del pipeline principal.
- El worker no procesa rasters, no devuelve métricas y no usa buffers transferibles; solo recibe objetos con polígonos.
- No existe binarización configurable porque el contrato de provider ya exige una máscara binaria.
- No existe benchmark, baseline, matching multi-wall ni regresión cuantitativa.
- No hay medición de memoria; los tiempos no incluyen percentiles ni desglose completo de provider/preprocesamiento.

## Preprocesamiento y postprocesamiento

- La imagen se redimensiona a un máximo de 512 px solo para análisis de bordes; el archivo original no se degrada.
- `GapFiller` usa un kernel relativo, limitado a radio 1–3.
- `NoiseCleaner` conserva el componente dominante y secundarios próximos con al menos 22 % de su área. Esta regla puede eliminar paredes pequeñas válidas si un provider une varias paredes en una región.
- `HoleRemover` solo conserva con seguridad una ventana/puerta si llega como máscara de exclusión o si supera el umbral de área.
- Las exclusiones semánticas se aplican después de cada etapa y tras rasterizar el polígono final.
- La simplificación usa Ramer–Douglas–Peucker y un segundo filtro angular.

## Quality score actual

`MaskQualityAnalyzer` combina confianza declarada por el provider, continuidad, ruido, huecos, rectitud, compactación, coincidencia aproximada con bordes y penalizaciones heurísticas. Este score sirve como estimación interna, pero no mide exactitud contra una pared esperada. En particular:

- puede ser alto para una máscara geométricamente limpia pero colocada en el lugar incorrecto;
- depende 25 % de la confianza del provider;
- no incluye IoU, Dice, precision, recall ni leakage real;
- decide si repetir el refinamiento, por lo que puede seleccionar una variante peor respecto a ground truth.

El score de evaluación se implementará aparte y solo podrá calcularse cuando exista ground truth. No se reemplazará el score de producción por una métrica que requiera datos no disponibles en uso real.

## Caché y reproducibilidad

La caché actual considera hash SHA-256 del contenido, provider, versión del provider, suavidad, tolerancia poligonal, debug y puntos de refinamiento. No incluye una versión explícita del pipeline ni el resto de la configuración de refinamiento. Por tanto, un cambio interno podría reutilizar un resultado antiguo durante el TTL de 30 minutos. El `mock` también usa IDs aleatorios.

## Problemas críticos iniciales

1. No existe ground truth ni baseline; cualquier afirmación previa de precisión sería subjetiva.
2. Todos los providers externos son placeholders. Solo `mock` y refinamiento local ejecutan código completo.
3. Un hueco no semántico puede perderse: `ContourExtractor` conserva el loop exterior y la máscara final se vuelve a rellenar desde ese polígono. Esto debe medirse especialmente en ventanas, puertas y oclusiones.
4. El cache key no invalida por versión/configuración completa del pipeline.
5. El mock no es determinista en IDs y no representa la imagen, por lo que no puede constituir un benchmark real de detección.

## Riesgos altos y medios

- Edge alignment busca bordes fuertes por scanline; un mueble, marco o cortina puede atraer el límite si cae dentro del desplazamiento permitido.
- Corner snap evalúa distancia a intersecciones, pero no valida mejora de boundary score ni curvatura.
- El raster final procede del polígono editable; esto mezcla pérdida por conversión con calidad del refinamiento raster.
- La evaluación de “ceiling/floor invasion” actual usa bandas superior/inferior, no máscaras ground truth específicas.
- Las alertas de ventana/cortina/sofá/cuadro son heurísticas; no identifican semántica real.
- La cancelación se comprueba entre regiones, no dentro de cada operación síncrona larga.
- La resolución de trabajo de 512 px puede ocultar errores de borde que luego se amplifican en imágenes grandes.
- La caché almacena respuestas de debug voluminosas si se solicitan en desarrollo.

## Partes no verificadas inicialmente

- Precisión sobre fotografías reales y generalización por tipo de habitación.
- Comportamiento y latencia de providers externos, porque no están implementados.
- Rendimiento real a 1080p del postprocesamiento: el pipeline productivo procesa a un máximo de 512 px.
- Memoria pico y coste de copias en navegador/servidor.
- Calidad táctil/UI del panel debug, fuera del alcance de esta fase salvo los datos técnicos.
- Cancelación cooperativa dentro de morfología, contornos y matching.

## Criterios iniciales de aceptación

Se medirán, pero no se tratarán como definitivos: IoU ≥ 0.80, Dice ≥ 0.88, Boundary IoU ≥ 0.70, precision/recall ≥ 0.85, leakage de exclusiones ≤ 5 % y postprocesamiento local ≤ 500 ms equivalente a 1080p. Con fixtures sintéticos estos valores describen consistencia geométrica, no calidad sobre fotos reales.

## Resultados de benchmark

### Dataset y baseline

Se crearon 15 fixtures sintéticos de 96×64 px: pared frontal, lateral, ventana, cortina, sofá, cuadros, televisión, puerta, pared oscura, blanca, varias paredes, columnas, iluminación fuerte, sombras y oclusión parcial. Cada caso incluye WebP, máscaras binarias esperadas sin antialias, exclusiones, metadata y predicción pregrabada. Tamaño total aproximado: 304 KB.

Baseline guardado en `tests/baselines/wall-detection-baseline.json`, pipeline 2.1.0:

| Métrica | Baseline 2.1.0 | Pipeline 2.1.6 | Cambio |
|---|---:|---:|---:|
| IoU | 0.9216 | 0.9459 | +0.0243 |
| Dice | 0.9590 | 0.9721 | +0.0130 |
| Precision | 0.9320 | 0.9602 | +0.0282 |
| Recall | 0.9883 | 0.9847 | −0.0035 |
| Boundary IoU, 3 px | 0.7544 | 0.8301 | +0.0757 |
| Distancia media de borde | 1.0809 px | 0.7394 px | −0.3415 px |
| Fragmentation score | 10.8262 | 9.3140 | −1.5122 |
| Polygon complexity score | 10.3394 | 4.3384 | −6.0010 |
| Quality score medido | 90.44 | 93.49 | +3.06 |
| Leakage con exclusiones | 0 % | 0 % | neutro |

La reducción de recall es pequeña y queda documentada; precision, IoU, borde y editabilidad mejoran. Ninguno de los 15 casos terminó con menor IoU que el baseline. El gate incluye casos `hard`, aperturas y oclusiones, no solo el promedio.

### Cambios conservados

1. La corrección de perspectiva solo se ejecuta con estructura vertical medible: cuatro líneas con dos soportes ≥ 0.12, o un par ≥ 0.18 acompañado por una exclusión baja compatible con apertura. La desactivación global mejoraba el promedio pero fue rechazada por regresiones en pared oscura y oclusión parcial.
2. Edge alignment solo se aplica cuando existen exclusiones semánticas. Desactivarlo globalmente fue rechazado por regresión en cortina.
3. `gapFilling` queda desactivado por defecto: la ablación mostró mejora conjunta de IoU, Boundary IoU y quality y el regression gate pasó todos los casos críticos.
4. El pipeline se versionó como 2.1.6 y el cache key incluye contenido, provider, versión de provider, configuración, objetivo de refinamiento y versión del pipeline.
5. El mock del servidor usa IDs deterministas.

### Resultados negativos y tradeoffs

- Aun con los ajustes, el pipeline sin etapas obtiene IoU 0.9539 frente a 0.9459 del pipeline completo. No se eliminaron todas las etapas: la ablación de `polygonOptimization` aumenta precisión raster, pero empeora notablemente la complejidad/editabilidad del polígono.
- `wall-with-columns` sigue siendo el peor caso y conserva alerta de fragmentación; separar varias paredes y columnas requiere dataset real antes de ajustar connected components.
- El mock obtiene IoU 0.7745, Boundary IoU 0.4967 y leakage aproximado de 49.2 %. Esto es esperable porque no observa la imagen ni produce exclusiones semánticas.
- El leakage final de 0 % solo demuestra que las exclusiones pregrabadas se respetan. No demuestra que un provider real sea capaz de detectar ventanas, puertas, cortinas o muebles.
- Thresholds 0.3–0.7 son equivalentes porque el contrato actual recibe máscaras binarias; no hubo evidencia para cambiar 0.5.
- Los tiempos de fixtures pequeños no validan todavía el objetivo de 500 ms a 1080p. El pipeline productivo limita el procesamiento a 512 px, por lo que hace falta un benchmark separado de escalado.

### Archivos de resultados

- `reports/wall-detection-benchmark.json`: datos completos por caso, etapa, dificultad, etiqueta, provider, tolerancia y curva precisión/puntos.
- `reports/wall-detection-benchmark.md`: resumen legible.
- `reports/wall-detection-ablation.md`: contribución de cada etapa.
- `reports/wall-detection-visuals/`: original, ground truth, predicción, overlay, falsos positivos, falsos negativos, bordes y refinado con leyenda.

### Recomendaciones futuras

1. Etiquetar fotografías propias con variedad de cámaras, habitaciones y oclusiones; no ajustar más producción usando solo geometría sintética.
2. Implementar al menos un provider real antes de comparar “modelos”.
3. Conservar raster con huecos como fuente de verdad en vez de depender únicamente del loop exterior poligonal.
4. Medir postprocesamiento y memoria a resoluciones de trabajo mayores antes de subir el límite de 512 px.
5. Diseñar matching multi-wall con casos reales de paredes pequeñas antes de cambiar `NoiseCleaner`.
