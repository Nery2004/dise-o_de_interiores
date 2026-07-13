# Matriz final de funcionalidades

Versión: 0.9.0-rc.1. Los estados describen evidencia disponible, no una promesa comercial.

- **Stable:** pruebas automatizadas y recorrido de producción local del flujo principal.
- **Beta:** funcional, persistido y probado parcialmente; falta cobertura real suficiente.
- **Experimental:** aproximación técnica disponible, deshabilitada o limitada por defecto.
- **Disabled:** el RC impide iniciar la función; los datos existentes se conservan.
- **Planned:** no implementado y no debe aparentar disponibilidad.

| Función | Estado | Default RC | Evidencia y límite principal |
|---|---|---:|---|
| Landing, navegación, FAQ y metadata | Stable | activa | Chrome, responsive, assets, Lighthouse y rutas de producción |
| Carga JPEG/PNG/WebP y validación | Stable | activa | metadata, dimensiones, MIME real y WebP E2E; repetir JPEG/PNG en Preview |
| Canvas y transformación central | Stable | activa | conversiones unitarias y alineación real en el flujo validado |
| Zoom, Ajustar, 100 % y Mano | Stable | activos | geometría, límites y pan probados; hardware táctil pendiente |
| Comparador | Stable | activo | mouse, teclado y touch emulado; solo cambia el recorte |
| Máscaras manuales | Stable | activas | crear/cancelar/validar, persistencia y geometría |
| Detección mock | Stable | activa | API y UI, cancelación, offline y 429; no representa precisión real |
| Provider IA externo | Disabled | apagado | conectores sin modelo/endpoint definitivo; API responde 503 |
| Edición de puntos | Stable | activa | transacciones, límites, add/remove y pruebas geométricas |
| Refinamiento con pincel | Beta | activo | worker, undo y raster cubiertos; gesto físico multinavegador pendiente |
| Simulación de pintura | Stable | activa | pipeline 1.3.0, fixtures, preview/export y exportación real |
| Base Blanca | Stable | activa | perfiles, neutralización, controles y regresión cromática |
| Exportación PNG | Stable | activa | pintura y composición probadas; memoria de escenas grandes sigue limitada |
| Proyectos locales | Stable | activos | IndexedDB, Blob, guardado/recarga y saneo de referencias |
| Importación/exportación de proyecto | Stable | activa | esquema v7, v1–v7, JSON corrupto, MIME y versión futura |
| Propuestas | Beta | activas | snapshots y export cubiertos; comparación/presentación E2E completa pendiente |
| Biblioteca de colores local | Stable | activa | búsqueda, filtros, favoritos, custom y aplicación |
| Supabase para paletas | Beta | opcional | falla cerrado si falta configuración; políticas públicas MVP |
| Biblioteca de objetos | Stable | activa | catálogo/asset local, filtros, favoritos y ausencia de 404 |
| Colocación, movimiento y transformación | Stable | activa | coordenadas de imagen, historial, render y export |
| Perspectiva y superficies | Beta | activa | flag `advancedPerspective`; geometría y persistencia cubiertas, E2E avanzada pendiente |
| Iluminación automática | Experimental | apagada | flag `automaticLighting`; aproximación local, no reconstrucción física |
| Sombras manuales/persistidas | Beta | activas | límites y render cubiertos; equivalencia multinavegador pendiente |
| Oclusión automática de objetos | Planned | apagada | no implementada |
| Grupos, capas y z-order | Beta | activos | integridad y operaciones unitarias; round-trip completo manual pendiente |
| Presentación | Beta | activa | usa miniaturas persistidas; focus trap/fullscreen E2E pendiente |
| Móvil | Beta | activo | seis viewports sin overflow; gestos avanzados en dispositivo físico pendientes |
| Herramientas de desarrollo | Disabled | producción | disponibles solo en desarrollo; `/dev/status` devuelve 404 en producción |
| Benchmarks/debug visual | Disabled | producción | scripts locales conservados; no se incluyen como interfaz productiva |

## Flags

| Flag | Default | Efecto |
|---|---:|---|
| `NEXT_PUBLIC_ENABLE_EXTERNAL_WALL_AI` | `false` | habilita opciones externas y permite solicitudes no mock |
| `NEXT_PUBLIC_ENABLE_ADVANCED_PERSPECTIVE` | `true` | muestra edición de superficies/perspectiva; los datos siempre se conservan |
| `NEXT_PUBLIC_ENABLE_AUTOMATIC_LIGHTING` | `false` | habilita análisis/adaptación automática de luz |

Las variables `NEXT_PUBLIC_*` quedan congeladas durante `next build`; cambiar un flag en Vercel requiere un nuevo deployment.
