# Compatibilidad de navegador y dispositivos

Solo se declara como probado lo realmente ejecutado.

| Plataforma | Estado RC | Evidencia |
|---|---|---|
| Chrome 150, macOS Intel | probado | producción local, CDP, Lighthouse y flujos principales |
| Safari reciente | objetivo, no confirmado | instalado pero no automatizado |
| Firefox reciente | objetivo, no confirmado | no disponible durante validación |
| Edge reciente | objetivo, no confirmado | no disponible durante validación |
| Chrome Android/iOS físico | Beta, no confirmado | viewports/touch emulado, no hardware |

Viewports probados en Chrome: 320×568, 375×667, 390×844, 768×1024, 1366×768 y 1440×900. No hubo overflow horizontal en las rutas principales.

## Nivel de soporte

- Desktop Chrome reciente: entorno recomendado del RC.
- Tablet: compatible como Beta; verificar memoria y paneles.
- Móvil: navegación/carga/comparación usable, pero edición precisa de vértices, rotación, perspectiva y pincel puede ser limitada.

Antes de declarar soporte oficial deben probarse carga, Canvas, IndexedDB, workers, object URLs, perspectiva, exportación/descarga y memoria en cada navegador. Safari tiene prioridad por diferencias históricas de Canvas, descarga y presión de memoria.
