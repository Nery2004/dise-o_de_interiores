# Auditoría de rendimiento

Fecha inicial: 2026-07-12. Entorno de automatización: Node 25 en esta máquina, build de producción Webpack de Next.js 16.2.10. Las cifras de interacción son proxies CPU reproducibles; este entorno no dispone de Chrome/Firefox/Safari, por lo que FPS, Web Vitals, memoria del heap y Lighthouse reales quedan explícitamente pendientes de validación manual.

## Presupuesto inicial

| Área | Objetivo operativo inicial | Naturaleza |
|---|---:|---|
| Landing usable | <3 s en red razonable | validar con Lighthouse real |
| Drag/pan/comparador | 60 FPS desktop; ≥30 FPS limitado | presupuesto de 16.7/33.3 ms por frame |
| Cambio de color preview | <300 ms perceptibles | objetivo; depende de tamaño/dispositivo |
| Exportación 1080p | <3 s | medible localmente |
| Memoria preview grande | <192 MiB ideal; sin crecimiento continuo | estimación + sesión real |
| Bundle landing propio | no crecer >15 %; reducir JS innecesario | medible por chunks |

No son garantías absolutas. Ultra conserva resolución/calidad final incluso si tarda más; la degradación se aplica solo al preview interactivo.

## Baseline inicial

Fuente reproducible: `tests/baselines/performance-baseline.json` y `reports/editor-performance.json`.

| Métrica | Inicial |
|---|---:|
| Pintura 1080p p50 / p95 | 1774 / 1900 ms |
| Render + encoding PNG 1080p p50 / p95 | 1790 / 1918 ms |
| Memoria estimada preview 6000×4000 High | 338.3 MiB |
| Bundle cliente landing | 67.8 KiB, 7 chunks |
| Bundle cliente editor | 726.7 KiB, 13 chunks |
| JS estático total | 1681 KiB |
| Historial sintético: 100 revisiones, 20 máscaras | 0.88 MiB serializados |
| Escena estrés: 50 objetos, 10 propuestas | 0.67 MiB serializados, sin buffers raster |
| Sitios de creación/uso de canvas encontrados | 24 |
| Tipos de worker | 2; iluminación persistente y refinamiento transitorio |
| Client Components | 91 |

Los microbenchmarks geométricos quedan muy por debajo de 1 ms p95. Esto indica que el cuello durante drag/máscaras no es la aritmética, sino frecuencia de `setState`, propagación de contextos, reconciliación, filtros CSS y rasterización.

## Arquitectura y cuellos de botella

### Prioridad crítica

1. **Preview sobredimensionado.** `CanvasRenderer` crea el canvas final con las dimensiones originales. High procesa al 70 % fijo: una foto 6000×4000 genera raster de 11.76 MP aunque el viewport muestre ~1–2 MP. El pico estimado es 338 MiB por escena/máscara grande.
2. **Pintura síncrona.** `PaintRenderPipeline` recorre cada píxel dos veces en el hilo llamador. Tiene `AbortSignal`, pero una función síncrona no puede recibir un aborto nuevo hasta devolver control al event loop.
3. **Estado por `pointermove`.** drag de objetos, marquee, cursor de colocación y pan llaman `setState` por evento; no hay agrupación RAF reutilizable. El pincel agrupa el repintado, pero el cursor sigue actualizando React por evento y no usa eventos coalescidos.

### Prioridad alta

4. **Provider global en landing.** `DecorObjectsProvider` vive en `app/layout.tsx`, hidrata IndexedDB y catálogo en rutas públicas que no lo consumen.
5. **Cachés heterogéneas.** Raster, capas, análisis y assets usan `Map` con límites por entradas, sin presupuesto común de bytes ni dispose. Una capa cacheada retiene canvas/píxeles y el máximo real depende de la imagen.
6. **Worker transitorio.** Cada refinamiento crea y termina un worker. Iluminación sí reutiliza uno, pero copia `ImageData` antes de transferirlo.
7. **Historial por snapshots.** Editor conserva hasta 100 clones completos del arreglo de máscaras; objetos conserva 50 escenas. No incluye rasters, pero trazos largos y muchas máscaras crecen multiplicativamente.
8. **Canvas de objetos.** ajustes, perspectiva y exportación crean canvases intermedios; la caché de render de objetos admite 96 MiB, además de las demás cachés.

### Prioridad media

9. Autosave tiene debounce de 2 s y mutex mediante `savePromiseRef`, pero la firma/serialización del estado todavía puede repetirse al cambiar la revisión.
10. Miniaturas usan exportación completa antes de reducir; es correcto visualmente pero costoso para listas/propuestas.
11. Exportación no ofrece progreso/cancelación pública y reserva el canvas completo antes de verificar presupuesto de memoria.
12. La API valida tamaño y timeout, pero el rate limit en memoria no es suficiente en Vercel distribuido.

## Riesgos e hipótesis

- Capar preview por viewport/DPR debe reducir memoria >50 % en imágenes grandes sin alterar exportación Ultra.
- RAF en interacciones debería limitar React a ≤1 actualización por frame; la ganancia real requiere profiler de navegador.
- Mover el provider de objetos a las rutas consumidoras debe reducir hidratación/IndexedDB en landing; la variación exacta se medirá tras build.
- Una LRU con bytes hace predecible la memoria, aunque puede aumentar misses en móviles.
- Worker/tiles completos para pintura implican riesgo alto de divergencia visual; primero se aplicarán escalado adaptativo, invalidación y caché. Se documentará cualquier parte no justificada por medición.

## Mediciones no disponibles automáticamente

- Tiempo hasta editor usable, carga de archivo, rerenders React y canvases activos reales.
- FPS de DOM/Canvas, heap real, GC y sesión larga.
- Lighthouse/Core Web Vitals y matriz Chrome/Safari/Firefox/Edge/móvil.

La instrumentación de desarrollo y la guía manual permitirán obtenerlas sin incluir logs en producción. No se inventarán resultados para estas áreas.

## Resultados finales

Medición final reproducible sobre build de producción: 2026-07-12/13. El benchmark puro ejecuta el mismo pipeline en Node y por eso no mide el beneficio de quitarlo del hilo UI; sí permite comprobar que no se degradó de forma material.

| Métrica | Inicial | Final | Cambio |
|---|---:|---:|---:|
| Pintura 1080p p50 | 1774 ms | 1714 ms | -3.41 % |
| Pintura 1080p p95 | 1900 ms | 1728 ms | -9.05 % |
| Render + PNG 1080p p50 | 1790 ms | 1733 ms | -3.16 % |
| Render + PNG 1080p p95 | 1918 ms | 1743 ms | -9.11 % |
| Preview 6000×4000 automático | 338.3 MiB estimados | 43.6 MiB, 1625×1083 | **-87.10 %** |
| Bundle cliente landing | 67.8 KiB / 7 chunks | 45.0 KiB / 6 | **-33.62 %** |
| Bundle cliente editor | 726.7 KiB | 725.7 KiB | -0.14 % |
| JS estático total | 1681.0 KiB | 1686.7 KiB | +0.34 % |

La ejecución final midió ~3–9 % menos tiempo en el pipeline/PNG, pero el algoritmo de exportación conserva resolución y salida; parte de esa diferencia puede ser variación de CPU/JIT. La mejora estructural de responsividad es distinta: el trabajo de pintura de preview puede ejecutarse en un pool de workers y las operaciones viejas se cancelan. No se afirma un FPS final porque no hubo navegador disponible; los proxies geométricos p95 quedan entre 0 y 0.046 ms y no representan DOM, raster o composición.

El estrés manual ejercitó 20 máscaras, 50 objetos, 10 propuestas, 1000 revisiones solicitadas y cinco secuencias pintura+PNG. Retuvo solo 100 revisiones y 24 entradas/6 MiB de caché. Con GC explícito, heap pasó de 8.5 MiB al inicio a 8.3 MiB después de limpiar; ArrayBuffers quedaron en 4.8 MiB frente a 1.0 MiB inicial. El RSS de Node permaneció alto por reservas nativas de Sharp, por lo que no se interpreta como heap del navegador.

## Optimizaciones aplicadas

- Preview adaptativo por viewport, DPR, memoria/dispositivo y modo; Ultra/exportación permanecen a resolución original.
- Worker persistente de pintura (máximo dos), pool persistente de refinamiento y cancelación con `AbortSignal`. La transferencia usa copias cuando el original pertenece a caché o estado, evitando buffers desconectados.
- Invalidación incremental por máscara: la clave incluye imagen, geometría y ajustes; cambiar una máscara reutiliza capas completas de las demás. Las promesas canceladas/rechazadas se eliminan.
- LRU con presupuesto en bytes para capas, fuentes raster, análisis de pared, assets y renders de objetos.
- RAF reutilizable para drag, cursores, pan y pincel; eventos coalescidos en pincel. El comparador modifica una variable CSS durante el arrastre y confirma React al finalizar.
- Callbacks estables y memoización efectiva de objetos no modificados. El cursor de máscara dejó el contexto global para no rerenderizar el editor completo.
- Historial acotado por bytes y cantidad; object URLs centralizadas y revocadas en reemplazo/reset/unmount.
- Exportación valida memoria antes de crear canvas, muestra etapas, permite cancelar y libera el backing store al terminar.
- `DecorObjectsProvider` se retiró del layout raíz y solo se carga en editor/objetos; la landing ya no abre IndexedDB ni hidrata ese catálogo.
- Instrumentación solo de desarrollo: distribuciones p50/p95, conteo de renders, bytes de caché y colas de workers. Se añadieron análisis de bundle, benchmark, gate y estrés manual.

No se agregaron dependencias. Next/Image ya cubría los assets relevantes y la aplicación usa fuentes del sistema, evitando una descarga de fuente adicional. La API ya rechazaba tamaño antes del procesamiento, aplicaba rate limit y timeout; no se cambió su lógica.

## Tradeoffs y límites conocidos

- Crear copias transferibles añade una copia lineal antes del worker; evita corrupción de caché y mantiene libre el hilo durante el cálculo pesado. En rasters pequeños se usa el camino síncrono para evitar overhead.
- Un preview automático contiene menos píxeles que la foto; puede verse menos fino al hacer zoom extremo. Calidad aumenta el presupuesto y Ultra/exportación preservan el resultado final.
- La estimación de 43.6 MiB modela buffers activos del preview, no el heap total del navegador ni la imagen decodificada por el motor.
- Codificar PNG con `canvas.toBlob` no expone progreso real ni cancelación interna; la cancelación se comprueba antes y después de esa etapa.
- El render de objetos durante exportación aún solo comprueba cancelación al terminar su lote.
- El rate limiter de la API es local a la instancia y no distribuido.
- Editor (725.3 KiB) sigue siendo la ruta cliente más pesada. El chunk propio es 258.8 KiB; separar paneles requerirá medición de tiempo-usable en navegador para no introducir saltos o cascadas de carga.

## Fallbacks y recomendación por dispositivo

Sin Worker: pipeline idéntico en hilo principal. Sin OffscreenCanvas: Canvas 2D. Sin `deviceMemory`: presupuesto de 4 GiB. Sin eventos coalescidos: evento de puntero normal. En móvil/≤2 GiB usar Rendimiento; en equipos comunes Automático; usar Calidad cuando se necesite detalle interactivo. La guía reproducible y la matriz manual están en `docs/performance-guide.md`.
