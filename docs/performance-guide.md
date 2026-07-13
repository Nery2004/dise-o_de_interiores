# Guía de rendimiento

Esta guía mantiene fluido Interior Color Studio sin modificar la salida visual final. Los límites son presupuestos de ingeniería, no promesas idénticas para todos los dispositivos.

## Comandos

```bash
npm run analyze                 # build de producción + reporte de chunks
npm run benchmark:performance   # CPU, memoria estimada, interacción y bundle
npm run performance:check       # compara contra el baseline con tolerancias
npm run benchmark:stress        # sesión sintética; es manual y más costosa
```

Los resultados quedan en `reports/`. Los benchmarks no forman parte de `npm test` porque CPU, JIT y carga del sistema introducen variación. Antes de cambiar deliberadamente el baseline, guardar el informe, explicar el motivo y ejecutar `tsx scripts/benchmark-performance.ts --write-baseline`.

## Presupuestos vigentes

- Una actualización React como máximo por frame para pointermove, pan, pincel y previsualizaciones.
- Preview automático: presupuesto por viewport, DPR, memoria declarada y dispositivo; no usar dimensiones originales por defecto.
- Exportación: resolución original/Ultra, dimensión máxima 16 384 y pico estimado máximo 1 GiB.
- Historial editor y objetos: máximo 12 MiB estimados además del límite por cantidad.
- Capas de pintura: 24 entradas/128 MiB; raster fuente: 4/128 MiB; análisis: 32/2 MiB; objetos renderizados: 48/96 MiB.
- Pools de pintura y refinamiento: uno o dos workers según CPU/memoria.

## Reglas al contribuir

1. No guardar `ImageData`, canvas, blobs u object URLs en historial o estado serializable.
2. Toda caché raster debe usar `LruCache`, declarar entradas y bytes, eliminar promesas rechazadas y exponer estadísticas de desarrollo.
3. Revocar object URLs al reemplazar, resetear o desmontar; usar `ObjectUrlManager`.
4. En eventos continuos usar `useRafCallback`, eventos coalescidos cuando existan y estado local/imperativo si el valor no pertenece al modelo del proyecto.
5. No recrear workers por operación. Enviar copias transferibles si el buffer original pertenece a caché/estado; transferir directamente solo si se cede su propiedad.
6. Pasar `AbortSignal` en renders y exportaciones; una respuesta cancelada nunca debe sobrescribir el resultado nuevo.
7. Mantener exportación en Ultra. La reducción adaptativa solo corresponde a preview.
8. Medir antes/después con el mismo build y entorno. No presentar una estimación de memoria o proxy CPU como FPS/heap real.

## Modos de preview

- **Rendimiento:** menor presupuesto raster para móvil/equipos limitados.
- **Automático:** valor recomendado; adapta píxeles al viewport, DPR y memoria.
- **Calidad:** más detalle interactivo dentro de un límite; la exportación no depende de este modo.

Sin Worker se ejecuta el mismo pipeline en el hilo principal. Sin OffscreenCanvas se usa Canvas 2D. Sin `deviceMemory` se asumen 4 GiB. Sin eventos coalescidos se procesa el evento normal. Estos fallbacks conservan funcionalidad y resultado.

## Validación manual de navegador

El entorno automatizado actual no incluye un navegador. Para una release, probar Chrome, Safari, Firefox y Edge; agregar un móvil o emulación de 2 GiB:

- Lighthouse de landing: Performance, Accessibility, Best Practices y SEO.
- Cargar 4K y 6000×4000; cambiar cinco colores rápidamente; confirmar que solo gana el último render.
- Arrastrar 50 objetos, editar puntos, hacer pan/zoom, usar comparador y pincel; registrar FPS y long tasks.
- Crear 20 máscaras, 10 propuestas, deshacer/rehacer 100 veces y exportar cinco veces.
- En Performance/Memory, tomar heap snapshots al inicio, tras la sesión y después de cerrar/cambiar proyecto. Object URLs, canvases y workers antiguos deben desaparecer tras GC.
- Consultar “Diagnóstico del editor” en desarrollo: p95 de render, cachés, colas de worker y conteo de renders.

Meta práctica: 60 FPS desktop (16.7 ms/frame), ≥30 FPS limitado (33.3 ms/frame), sin crecimiento continuo de memoria. Registrar dispositivo, navegador, tamaño de imagen y modo; sin esos datos un número de FPS no es comparable.

## Revisión de regresiones

`performance:check` tolera +25 % en pintura, +30 % en exportación, +10 % en memoria estimada y +15 % en bundles de ruta. Una falla exige investigar; no se corrige ampliando el umbral sin evidencia. Revisar además el reporte de chunks porque un total estable puede esconder código movido a la carga inicial.
