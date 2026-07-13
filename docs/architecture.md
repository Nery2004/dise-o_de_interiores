# Arquitectura

## Vista general

```mermaid
flowchart LR
  B[Browser / React 19] --> R[Next.js 16 App Router]
  R --> E[Editor client components]
  E --> C[Canvas transform + overlays]
  E --> P[Paint pipeline]
  E --> O[Decor render pipeline]
  E --> I[(IndexedDB)]
  E --> W[Web Workers]
  E -. opcional .-> S[Supabase palettes]
  E --> A[/api/detect-walls]
  A --> M[Mock provider]
  A -. disabled RC .-> X[External providers]
  R --> V[Vercel build/runtime]
```

## Next.js y rutas

`app/` usa App Router. Landing, privacidad, objetos y recursos SEO pueden prerenderizarse; editor/colores/proyectos incorporan estado cliente. `/api/detect-walls` es un Route Handler Node dinámico con validación, rate limit, timeout, caché y respuestas tipadas. `/dev/status` existe únicamente en desarrollo y el proxy devuelve 404 en producción.

## Editor y coordenadas

`EditorProvider` conserva imagen, máscaras, herramienta y pintura. `useCanvasTransform` es la fuente canónica de fit, zoom, pan y conversiones pantalla→viewport→imagen. Imagen, máscaras, objetos, superficies, comparador y overlays consumen esa transformación; solo las coordenadas de imagen se persisten.

## Máscaras y detección

`WallMask` vive en `types/editor.ts`. Las máscaras manuales y automáticas convergen al mismo modelo editable. El cliente envía multipart a `/api/detect-walls`; el mock y el refinamiento local producen regiones raster que `SegmentationPipeline` limpia y convierte en polígonos. `WALL_DETECTION_PIPELINE_VERSION` participa en caché, diagnóstico y benchmarks.

## Pintura

`PaintRenderPipeline` procesa rasters de forma pura: Base Blanca, reemplazo cromático OKLab, iluminación, textura, sombras, highlights, gamut y alpha. `CanvasRenderer` adapta imagen/máscara y compone. Editor, comparador, miniaturas, propuestas y exportación usan la misma ruta; exportación usa calidad Ultra. Workers y LRU acotadas reducen bloqueo/memoria. `PAINT_PIPELINE_VERSION` invalida cachés.

## Objetos, perspectiva e iluminación

El catálogo canónico está en `data/decorObjects.ts` y sus tipos en `types/decor-object.ts`. `DecorPlacementProvider` administra objetos, grupos, superficies y geometría. La vista interactiva usa DOM/Canvas y la exportación `renderPlacedDecorObjects`. `DECOR_RENDER_PIPELINE_VERSION` forma parte de la clave de raster ajustado. Perspectiva es Beta; iluminación automática está deshabilitada por defecto, pero datos ya persistidos se cargan y exportan.

## Proyectos y propuestas

IndexedDB guarda `InteriorProject` y el Blob original. `PROJECT_SCHEMA_VERSION=7` y `LATEST_PROJECT_VERSION=7`; las migraciones son secuenciales, puras y saneadas antes de validar. Importación portable admite exclusivamente JPEG/PNG/WebP acotados. Propuestas guardan snapshots de estado, no copias del raster original.

## Supabase y privacidad

Supabase solo es un repositorio opcional de paletas. El cliente se crea únicamente con URL HTTP/HTTPS y anon key completas. Imágenes/proyectos no se suben a Supabase. Providers externos podrían procesar imágenes únicamente si el flag y la configuración futura se habilitan; en el RC están apagados.

## Estructura principal

- `app/`: rutas, layout, metadata, error boundaries y API.
- `components/`: interfaz pública, contexts y herramientas del editor.
- `config/`: identidad, versión, canal y flags.
- `data/`: catálogos/contenido estático.
- `lib/`: dominio, geometría, render, persistencia, API y utilidades.
- `types/`: contratos canónicos compartidos.
- `public/`: assets servidos por Next/Vercel.
- `workers/`: entradas de workers de pintura, refinamiento e iluminación.
- `tests/`: pruebas unitarias/integración y fixtures propios declarados.
- `scripts/`: generación, benchmarks, estrés y análisis.
- `reports/`: salidas reproducibles versionadas.
- `docs/`: decisiones, auditorías y operación.
- `supabase/`: esquema opcional y políticas RLS.

No existe una carpeta `contexts/` o `hooks/`: los contexts están en `components/` y hooks especializados junto a su dominio.
