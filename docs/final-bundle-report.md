# Reporte final de bundle

Generado sobre el build 0.9.0-rc.1 con Node 22 y `scripts/analyze-bundle.ts`. Los bytes por ruta incluyen chunks compartidos y no deben sumarse.

| Ruta | JS cliente | Chunks |
|---|---:|---:|
| `/` | 45.0 KiB | 6 |
| `/editor` | 727.9 KiB | 13 |
| `/colors` | 346.3 KiB | 10 |
| `/projects` | 174.9 KiB | 10 |
| `/objects` | 137.6 KiB | 10 |
| `/privacy` | 50.7 KiB | 7 |

JS cliente único entre nueve rutas analizadas: 826.6 KiB.

## Chunks principales del editor

- 260.2 KiB: chunk propio de `/editor`.
- 168.5 KiB: chunk compartido principal.
- 76.9 KiB, 67.0 KiB y 61.0 KiB: siguientes chunks compartidos/funcionales.

## Tendencia

La validación anterior registró landing 45.0 KiB, editor 725.7 KiB y aproximadamente 825.0 KiB únicos. El RC conserva la landing sin crecimiento y aumenta el editor ~2.2 KiB (0.3 %) por flags/configuración de release; no es una regresión material.

La landing no carga el chunk propio del editor, workers, motor de pintura, exportador ni catálogo completo de objetos. El editor sigue siendo la ruta más pesada; dividirla sin medir tiempo-usable podría introducir cascadas, por lo que no se hizo una optimización grande en el cierre.

## Riesgos

- `/colors` comparte dependencias de preferencias/paletas y es la segunda ruta más pesada.
- El tamaño no mide memoria Canvas, workers ni tiempo hasta interacción.
- Los hashes cambian entre builds; se versiona aquí el resumen legible, no el JSON generado localmente por esta ejecución.
