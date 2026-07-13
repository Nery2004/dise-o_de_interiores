# Auditoría del motor de pintura

Auditoría inicial y cierre: 2026-07-12. Las secciones hasta “Arquitectura final” conservan la fotografía previa al cambio para no reescribir los hallazgos retrospectivamente. El motor es una simulación visual perceptual; no es un modelo físico de pintura, acabado o iluminación real.

## Arquitectura anterior

1. `CanvasRenderer` filtra las máscaras visibles, resuelve sus parámetros y genera una capa raster por máscara.
2. `MaskFeatherPass` crea el alpha refinado y aplica blur mediante Canvas.
3. `wallBaseAnalysisService` analiza el color original de la pared y conserva un resumen persistible.
4. `whiteBaseOptimizer` convierte el perfil cálido/frío/neutro/saturado en parámetros deterministas.
5. `PaintPipeline.processPaintPixel` transforma cada píxel en OKLab:
   - Base Blanca adaptativa opcional;
   - extracción de iluminación local;
   - extracción de textura como diferencia de luminancia respecto a un promedio local;
   - reemplazo cromático;
   - recomposición de sombras y textura;
   - conversión final a sRGB.
6. `CanvasRenderer` escribe una capa RGBA cuyo alpha procede exclusivamente de la máscara feathered.
7. La capa se compone sobre la imagen original en preview o exportación.

## Rutas de render verificadas

| Consumidor | Ruta | Observación inicial |
|---|---|---|
| Editor | `PaintRenderer → renderPaintScene` | Renderiza capa transparente y el DOM la muestra sobre la imagen original. |
| Comparador | `RenderedEditorImage → renderPaintScene` | Renderiza original y pintura dentro del mismo canvas. |
| Exportación | `exportEditedImage → renderPaintScene` | Usa el mismo pipeline y después compone objetos. |
| Miniatura de proyecto | `createProjectThumbnail → exportEditedImage` | Render completo y reducción JPEG. |
| Miniatura de propuesta | `createProposalThumbnail → createProjectThumbnail` | Misma ruta que proyecto. |
| Propuesta exportada | `renderProposal → exportEditedImage` | Misma ruta de pintura. |
| Presentación | thumbnail persistida | No vuelve a renderizar en vivo; hereda la calidad/compresión de la miniatura. |

La lógica final no depende de `mix-blend-mode` CSS. `BrushRefinementOverlay` usa CSS únicamente como guía de edición. Algunos componentes de landing/showcase usan overlays CSS, pero no forman parte del editor ni de la exportación.

## Espacio de color y luminancia

- sRGB se convierte a lineal antes de OKLab.
- La luminancia perceptual usada por el pipeline es `OKLab L`; `relativeLuminance()` implementa luminancia física WCAG por separado.
- El modo `color` sustituye crominancia en OKLab y conserva `L` del fondo.
- Multiply/overlay/soft-light/hard-light operan sobre canales sRGB gamma-corrected por compatibilidad visual, no como mezcla física lineal. Esto debe considerarse una aproximación.
- La salida se limita durante la conversión a sRGB; no existe gamut mapping perceptual explícito.

## Separación de controles

- `WallMask.opacity` se usa para visualizar máscara/selección, no para la pintura final.
- `paintIntensity` controla la fuerza del reemplazo cromático, no el alpha.
- `primerCoverage` controla la neutralización, no el alpha final.
- `blendMode` selecciona la matemática de combinación.
- El alpha final procede de geometría, refinamientos y feather.

La separación existe en código, pero no está formalizada por un tipo de entrada/salida único ni cubierta por métricas independientes.

## Valores predeterminados

Los defaults ya son fuertes y centralizados: Base Blanca, intensidad 100, imprimación 100, sombras/textura 90, feather 4 px, calidad High y `paint-simulation`. Sin embargo, la curva actual convierte intensidad 100 a fuerza de reemplazo 0.82; por ello una dominante cálida puede seguir contaminando el color seleccionado.

En modo automático, `primerCoverage` se multiplica por la recomendación del perfil. Así, el control al 100 puede producir cobertura efectiva 55 en una pared neutral clara u 80 en una cálida. Es determinista, pero la etiqueta “cobertura” no corresponde directamente al valor efectivo.

## Base Blanca

La implementación no es una capa blanca plana. Reduce crominancia en OKLab, corrige calidez, eleva luminancia con límite, conserva iluminación relativa y reaplica detalle de alta frecuencia. Los perfiles beige/amarillo/azul/gris/oscuro/blanco tienen recomendaciones distintas.

Riesgos:

- no existe una etapa explícita de protección de highlights;
- el límite superior depende del clamp final y puede comprimir reflejos;
- la corrección de calidez actúa solo sobre el eje `b` de OKLab;
- objetos incluidos en la máscara pueden influir en el análisis pese al filtrado robusto;
- la textura de objetos se procesa igual que textura de pared.

## Sombras, highlights y textura

- Las sombras se modelan como relación entre luminancia local y promedio, limitada a 0.25–1.8.
- `shadowPreservation` mezcla esa relación con iluminación neutra.
- La textura es `L píxel − L promedio local` y se reaplica con un factor controlado.
- No hay `HighlightPreservationPass`; luces y reflejos usan la misma relación de iluminación que el resto.
- No hay filtro semántico de textura. El muestreo cromático rechaza outliers, pero la recomposición por píxel no distingue cuadro, marco o compresión JPEG.

## Feather, alpha y halos

El feather usa `CanvasRenderingContext2D.filter = blur()` sobre una máscara transparente y recupera su alpha. Canvas maneja color premultiplicado, pero el ancho real puede variar por implementación/resampling. La capa pintada usa ese alpha una sola vez al dibujarse; `WallMask.opacity` no vuelve a multiplicarlo.

No existen aún pruebas cuantitativas de ancho, simetría, fuga o halos para 0/5/10/20/40 px.

## Calidad y rendimiento

| Calidad | Escala | Uso actual |
|---|---:|---|
| Draft | 0.4 | Preview rápido |
| High | 0.7 | Default recomendado |
| Ultra | 1.0 | Seleccionable manualmente |

La exportación no fuerza actualmente Ultra: respeta `mask.renderQuality`. Por tanto, un proyecto guardado en Draft puede exportarse usando una capa de pintura a 40 % reescalada. El preview High y export pueden coincidir porque usan la misma calidad guardada, pero no necesariamente ofrecen máxima precisión.

No existe tiling ni worker para pintura. El procesamiento por máscara ocurre en el hilo principal y crea raster de origen, alpha, luminancia, promedio local, `ImageData` de salida y canvas intermedio. Con imágenes grandes puede haber presión de memoria.

## Caché y concurrencia

- Raster de imagen: LRU simple de 4 entradas por URL+escala.
- Capas pintadas: LRU simple de 24 promesas; la clave incluye URL, máscara, color, refinamiento, parámetros y calidad.
- Análisis de Base Blanca: 32 entradas con una firma estable de imagen/máscara.
- Ninguna clave incluye una versión explícita del pipeline.
- Las cachés se limitan por cantidad, no por bytes.
- React evita que una promesa antigua se dibuje mediante una bandera `cancelled`, pero el cálculo anterior continúa y ocupa CPU/memoria. No existe `AbortSignal` dentro del loop por píxel.

## Duplicación y diferencias preview/export

La matemática de pintura está centralizada. La diferencia estructural es la composición:

- preview principal: capa RGBA transparente sobre `<img>`;
- export/comparador: original y capa en Canvas;
- miniatura: export Canvas seguida por reducción JPEG;
- presentación: JPEG persistido.

Esto puede introducir pequeñas diferencias de resampling, administración de color del navegador y compresión, aunque los píxeles de pintura provengan del mismo pipeline.

## Problemas críticos y altos a medir

1. Intensidad 100 equivale a 82 % de reemplazo y puede dejar beige/amarillo en el resultado.
2. Exportación no fuerza Ultra.
3. No existe benchmark cromático ni baseline visual.
4. No hay protección explícita de highlights.
5. Feather depende de Canvas y carece de métricas de halo/fuga.
6. No existe comparación automática preview High vs export Ultra.
7. Pipeline y cachés no están versionados.
8. No hay cancelación cooperativa ni tiling para imágenes grandes.

## Placeholders o funciones inexistentes

- `PaintRenderPipeline` con entrada/salida raster uniforme: inexistente; solo hay función por píxel y orquestador Canvas.
- Highlight preservation: inexistente como paso independiente.
- Debug de luminancia/textura/base/color/sombras/highlights: inexistente.
- Tile renderer y worker de pintura: inexistentes.
- Métricas cromáticas, luminancia, textura, sombras, feather y preview/export: inexistentes.

No se añadirá worker o tiling sin medición que justifique su complejidad.

## Partes no verificadas inicialmente

- ΔE y fidelidad de midtones sobre fixtures controlados.
- Diferencia perceptual High/Ultra.
- Ancho real de feather y halos por navegador.
- Rendimiento 1080p/4K y memoria pico.
- Variación entre Canvas de Chrome, Safari y Firefox.
- Correspondencia con pintura física, que depende de pantalla, cámara, iluminación, acabado y superficie.

## Arquitectura final

`PaintRenderPipeline` recibe rasters y parámetros mediante `PaintRenderInput` y devuelve `PaintRenderResult`, sin estado de React ni dependencia de Canvas. `CanvasRenderer` queda como adaptador: carga/corta el raster, prepara alpha y análisis, llama al pipeline puro y compone su capa. Editor, comparador, miniaturas, propuestas, exportación y presentación siguen una única ruta; exportación fuerza Ultra.

Orden de `paint-simulation`:

1. conversión sRGB lineal → OKLab;
2. Base Blanca adaptativa según perfil y curva de imprimación;
3. campo de luminancia local;
4. separación de iluminación y textura;
5. reemplazo cromático con curva perceptual de intensidad;
6. recomposición de sombra y textura;
7. protección de altas luces excepcional respecto al promedio;
8. mapeo de gamut conservando L y hue;
9. alpha geométrico/feather y composición.

Se añadieron pases con nombres explícitos para reemplazo cromático, sombra, extracción/reaplicación de textura y highlights. `colorManagement.ts` centraliza conversiones, luminancia, ΔE, hue y gamut. El feather ahora es un blur gaussiano separable y determinista solo sobre alpha; no difumina RGB transparente.

La clave de capa incluye `PAINT_PIPELINE_VERSION` (final `1.3.0`). Existe además una clave estable precromática que incluye imagen, versión de máscara, calidad, neutralización, feather y versión, pero excluye `targetColor`. La interfaz del pipeline acepta `AbortSignal`; los componentes ya descartan resultados React obsoletos. No se añadió worker ni tiling: el benchmark 1080p no mostró inestabilidad o límite de Canvas, aunque Ultra síncrono sigue siendo costoso y queda como trabajo futuro si aparecen imágenes mayores o bloqueos reales.

### Modos de mezcla

Todos pasan por el mismo código TypeScript tanto en preview como exportación; no dependen del operador CSS homónimo.

| Modo | Propósito y límite |
|---|---|
| normal | Sustitución RGB interpolada; fuerte, pero conserva menos estructura cromática. |
| multiply | Oscurece por producto sRGB; útil como efecto, no para igualar un HEX. |
| color | Usa L del fondo y `a/b` del target en OKLab; aproximación perceptual. |
| overlay | Aumenta contraste según el fondo; puede alterar mucho el target. |
| soft-light | Contraste suave artístico; cobertura cromática limitada. |
| hard-light | Contraste según el target; puede ser agresivo. |
| paint-simulation | Recomendado: Base Blanca, color, iluminación, textura, sombras y highlights controlados. |

## Dataset, baseline y umbrales

Se crearon 12 fixtures propios de 96×64: pared blanca, beige, amarilla, azul, gris oscura, gradiente, sombra lateral, textura, reflejo, esquina, ruido fotográfico y máscara con feather. Cada caso guarda WebP, máscara PNG binaria, target, configuración y notas. Los resultados visuales están en `reports/paint-rendering-visuals/`.

Baseline `1.0.0`: pipeline consolidado con la matemática previa (intensidad 100 → 0.82), feather determinista y export Ultra, antes de ajustar color. El gate usa tolerancias medidas: ΔE global +1, textura −5 puntos, sombras −5, preview/export ΔE +0.5, tiempo +25 % +5 ms y ΔE por caso +2. No está conectado a CI; se ejecuta con `npm run benchmark:paint:check`.

## Resultados antes/después

| Métrica | Baseline 1.0.0 | Final 1.3.0 | Cambio |
|---|---:|---:|---:|
| ΔE medio de midtones | 4.07 | 2.59 | −36.5 % |
| Error de matiz | 3.40° | 1.59° | −53.2 % |
| Preservación de luminancia | 97.90 | 98.70 | +0.80 |
| Preservación de textura | 88.74 | 87.32 | −1.42 |
| Estructura de sombras | 86.24 | 90.54 | +4.30 |
| ΔE Alta/Ultra | 0.0132 | 0.0261 | +0.0129; todavía imperceptible |
| Canales recortados | 64 | 0 | −64 |
| Tiempo medio Alta+Ultra, fixture | 14.24 ms | 13.78 ms | −0.46 ms; ruido de ejecución posible |

La mejora cromática se obtuvo haciendo que intensidad 100 represente 0.96 de reemplazo y reservando 100–200 para cobertura/croma limitado. La imprimación 0/50/100 produce una progresión separada; en la pared beige de control, ΔE fue 1.08/0.68/0.32. Paint Simulation logró ΔE 0.32 frente a 1.59 en normal y valores mayores en los modos artísticos del mismo caso.

El costo medido en un gradiente sintético equivalente a 1080p fue: Draft 768×432 ≈329 ms/7.0 MiB, High 1344×756 ≈889 ms/21.3 MiB y Ultra 1920×1080 ≈1.84 s/43.5 MiB. Son tiempos síncronos de Node en esta máquina, no presupuesto de frame de navegador. Draft/High reducen previamente la resolución; Ultra se reserva para exportación.

## Regresiones y limitaciones finales

- Textura bajó 1.42 puntos al fortalecer cobertura; queda dentro del umbral y la preservación media sigue en 87.32. El gradiente y la textura sutil exponen que la métrica high-pass mezcla gradiente, ruido y detalle; no se ocultaron del promedio.
- `feather-mask` tiene ΔE alto (15.17) porque la métrica de midtone incluye una escena de borde/alto contraste diseñada para alpha, no solo un parche uniforme. Sus métricas de feather son el criterio principal.
- La presentación consume una miniatura JPEG persistida y puede mostrar compresión; no persiste buffers de pintura.
- No hay segmentación semántica de textura. Bordes de objetos incluidos en la máscara se limitan mediante el campo local y controles, pero no se reconocen como objetos.
- No se implementó debug visual de pases en UI, worker, OffscreenCanvas o tiles: no eran necesarios para corregir la precisión y añadirlos habría ampliado la fase.
- El gamut mapping evita clipping duro, pero colores fuera de sRGB pierden croma inevitablemente.
- La gestión final depende todavía del perfil/color management del navegador y pantalla. No se midieron diferencias reales Chrome/Safari/Firefox ni pantallas P3.
- La prueba automática Alta/Ultra compara el mismo raster controlado; el manual cubre resampling, navegador, miniaturas y móvil.

La simulación no predice pintura física. Iluminación, pantalla, cámara, acabado y superficie pueden cambiar de forma material la percepción del color real.
