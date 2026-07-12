# Matriz de compatibilidad funcional

Auditoría conservadora realizada sobre la versión 0.2.0. “Estable” significa verificación automatizada y revisión del flujo; las pruebas manuales de navegador siguen siendo necesarias en cada plataforma objetivo.

| Funcionalidad | Estado | Componente principal | Persistencia | Undo/redo | Exportación | Responsive | Problemas conocidos |
|---|---|---|---|---|---|---|---|
| Carga y validación de imagen | estable | `EditorProvider`, `ImageUploader` | Blob original en IndexedDB; URL temporal recreada | No aplica | Resolución original | funcional | Límite de 10 MB y 5000 px por lado; 6000×4000 se rechaza deliberadamente |
| Ajuste, zoom y Mano | estable | `CanvasViewer`, `useCanvasTransform` | Zoom guardado | No | Misma geometría de imagen | funcional | En móvil los paneles se apilan y reducen el área útil |
| Comparador Antes/Después | funcional con limitaciones | `ComparisonView`, `ComparisonHandle` | Modo no guardado | No | PNG de comparación | funcional | Falta una prueba E2E de gesto táctil; el historial no incluye la posición del divisor |
| Máscaras automáticas | funcional con limitaciones | `WallDetectionPanel`, API `/api/walls/*` | Sí | Resultado agregado como acción | Sí | funcional | Calidad y disponibilidad dependen del proveedor; el proveedor `mock` no equivale a detección real |
| Máscaras manuales | estable | `MaskOverlay`, `ManualMaskDrawer` | Sí | Sí, una entrada por máscara | Sí | funcional | Cierre exige al menos tres puntos |
| Edición de puntos | estable | `EditableMaskOverlay`, `useMaskEditor` | Sí | Transacción lógica | Sí | funcional | Handles pequeños pueden ser exigentes en pantallas táctiles |
| Refinamiento con pincel | estable | `BrushRefinementOverlay` | Trazos en proyecto | Un trazo por acción | Sí | funcional | La previsualización usa RAF; trazos muy densos aumentan el tamaño del proyecto |
| Motor de pintura | estable | `CanvasRenderer` | Ajustes por máscara | Sí | Pipeline compartido | funcional | Preview y export usan calidades distintas, por lo que el antialias puede variar mínimamente |
| Base Blanca | estable | `wallBaseAnalysisService`, `CanvasRenderer` | Sí | Sí | Sí | funcional | El análisis automático es heurístico |
| Biblioteca de colores | funcional con limitaciones | `ColorLibraryPage`, `ColorPalette` | Local y Supabase cuando existe | Aplicación a pared: sí | Sí | funcional | Funciones remotas no están disponibles sin Supabase |
| Proyectos locales | estable | `ProjectProvider`, `projectStorage` | IndexedDB, esquema v7 | Historial de sesión, no persistido | Archivo de proyecto y PNG | funcional | Depende de cuota/disponibilidad de IndexedDB |
| Migración de proyectos v1–v7 | estable | `projectValidation` | Migra al cargar/importar | No aplica | Conserva datos exportables | No aplica | Versiones futuras se rechazan de forma explícita |
| Propuestas | funcional con limitaciones | `ProjectProvider`, `ProposalPanel` | Snapshot dentro del proyecto | Aplicar propuesta entra en historiales de dominio | Sí | funcional | La miniatura JPEG puede diferir levemente del PNG ultra |
| Biblioteca de objetos | estable | `DecorObjectsProvider`, catálogo local | Favoritos/carpetas locales | No para navegación | Objetos colocados: sí | funcional | Solo acepta assets locales PNG/WebP declarados |
| Colocación y transformación | estable | `DecorObjectsLayer`, `DecorPlacementProvider` | Sí | Una entrada por gesto | Sí | funcional | Vista CSS interactiva y raster de exportación pueden diferir levemente en perspectiva compleja |
| Perspectiva y superficies | funcional con limitaciones | `SurfaceOverlay`, geometría de perspectiva | Sí | Sí | Sí | funcional | La detección de superficie es heurística; cuadriláteros inválidos se rechazan |
| Iluminación y sombras | funcional con limitaciones | `RoomLightingProvider`, pipeline de objetos | Sí | Sí por dominio | Sí | funcional | Estimación local, no reconstrucción física; worker depende de OffscreenCanvas |
| Grupos, capas y z-order | estable | `DecorPlacementProvider`, paneles de objetos | Sí | Sí | Sí | funcional | Un objeto solo puede pertenecer a un grupo; referencias inválidas se saneán al cargar |
| Modo presentación | funcional con limitaciones | `PresentationMode` | No | No | Usa snapshots/miniaturas | funcional | No tiene focus trap completo ni prueba E2E de fullscreen |
| Exportación PNG | estable | `exportEditedImage`, `CanvasRenderer` | No aplica | No aplica | Resolución original, sin UI/guías/handles | funcional | Puede fallar por memoria en dispositivos limitados con escenas grandes |
| Diagnóstico de desarrollo | estable | `DevEditorDiagnostics`, `/dev/status` | `sessionStorage` sin secretos | No | No | desktop | Solo existe en desarrollo; `/dev/status` muestra la última muestra de la pestaña |

## Coherencia de render

Pintura, miniaturas, propuestas, comparación y exportación llaman al mismo `CanvasRenderer`. Los objetos comparten `renderPlacedDecorObjects` y `DecorObjectRenderPipeline`; cambia únicamente la calidad (`high` para preview y `ultra` para exportación). Las guías, selecciones, handles y paneles son capas de interfaz y no se rasterizan.

## Historial

Los historiales de máscaras/pintura, objetos/perspectiva y luz están limitados y agrupan los gestos en transacciones. Continúan siendo tres historiales de dominio: el botón global prioriza objetos, luego luz y luego editor, no el último evento cronológico entre dominios. Un historial global con marcas temporales queda pendiente porque implicaría cambiar contratos de estado y migración, fuera del alcance conservador de esta auditoría.
