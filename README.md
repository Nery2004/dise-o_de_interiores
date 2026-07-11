# Interior Color Studio

Aplicación web para cargar una fotografía de una habitación, seleccionar paredes, probar colores conservando la lectura de sombras y textura, comparar propuestas y exportar el resultado. La aplicación funciona sin autenticación y guarda proyectos localmente por defecto.

## Funcionalidades

- Detección mock y arquitectura configurable de proveedores de IA.
- Máscaras automáticas y manuales, edición de vértices y refinamiento por pincel.
- Biblioteca de colores, favoritos, armonías y paletas personalizadas.
- Comparador antes/después y múltiples propuestas de diseño.
- Proyectos completos en IndexedDB, importación y exportación JSON.
- Exportación de imágenes en la resolución original.
- Paletas opcionales mediante Supabase.
- Landing, privacidad, sitemap, robots y Open Graph preparados para publicación.

## Stack

- Next.js 16 con App Router y Route Handlers.
- React 19 y TypeScript estricto.
- Tailwind CSS 4.
- IndexedDB mediante `idb`.
- Supabase JS para paletas opcionales.
- Canvas 2D y SVG para máscaras, refinamientos y exportación.
- Node.js runtime para `/api/detect-walls` e `image-size` para validación.

## Requisitos

- Node.js 22 LTS (`.nvmrc`).
- npm y `package-lock.json` como único gestor de paquetes.
- Navegador moderno con Canvas e IndexedDB para todas las funciones del editor.

## Instalación local

El repositorio ya está creado y conectado a GitHub. No es necesario ejecutar `git init`, configurar remotos ni renombrar ramas.

```bash
nvm use
npm ci
npm run dev
```

La aplicación abre en `http://localhost:3000`. No se necesita `.env.local` para compilar o usar el modo mock. Si se desea configurar servicios opcionales, se puede crear localmente a partir de `.env.example`; nunca debe enviarse al repositorio.

## Variables de entorno

| Variable | Exposición | Obligatoria | Uso/fallback |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Pública | No | URL SEO. Usa `http://localhost:3000` si falta. Configurar después de obtener la URL definitiva. |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | No | URL pública del proyecto de Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | No | Anon public key. La app deshabilita paletas cloud si falta. |
| `WALL_AI_PROVIDER` | Privada | No | `mock`, `replicate`, `huggingface` o `roboflow`. Fallback: `mock`. |
| `WALL_AI_TIMEOUT_MS` | Privada | No | Timeout entre 1 y 60 segundos. Fallback: `15000`. |
| `REPLICATE_API_TOKEN` | Privada | Solo al usar Replicate | Token del servidor. |
| `HUGGINGFACE_API_TOKEN` | Privada | Solo al usar Hugging Face | Token del servidor. |
| `ROBOFLOW_API_KEY` | Privada | Solo al usar Roboflow | Token del servidor. |

Las variables `NEXT_PUBLIC_*` pueden llegar al navegador. Las demás deben configurarse solo en el entorno del servidor/Vercel. Nunca uses una Supabase `service_role` key en frontend.

## Scripts

```bash
npm run dev        # desarrollo
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir archivos
npm test           # pruebas ligeras sin servicios externos
npm run build      # build estricto de producción
npm run start      # ejecutar el build localmente
```

## Estructura principal

```text
app/                 rutas, API y metadata de Next.js
components/          UI pública y editor
config/              versión y navegación
data/                catálogo y contenido estático
lib/colors/          conversiones y preferencias
lib/geometry/        geometría de máscaras y pinceles
lib/projects/        persistencia, migración e importación
lib/proposals/       snapshots, estadísticas y exportación
lib/server/          providers, logging, timeout y rate limiting
tests/               pruebas críticas
supabase/            esquema SQL y RLS
docs/                checklist operativo
```

## Supabase para paletas

Supabase es opcional; sin configuración la aplicación sigue compilando y muestra un estado controlado.

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**.
3. Ejecuta [`supabase/schema.sql`](supabase/schema.sql).
4. Copia **Project URL**.
5. Copia únicamente la **anon public key**.
6. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en local/Vercel.

El esquema habilita RLS. Las políticas actuales permiten lectura e inserción pública sin login, apropiadas únicamente para el alcance MVP. Antes de una exposición amplia deben revisarse límites, abuso, actualización y eliminación. No uses `service_role` en el navegador.

## Proveedores de IA

`WALL_AI_PROVIDER=mock` es el modo seguro por defecto y no envía la imagen a un proveedor externo. Cuando el usuario elige IA real, la interfaz avisa que la imagen puede procesarse temporalmente.

Los adaptadores Replicate, Hugging Face y Roboflow validan que exista su token, pero todavía requieren seleccionar y conectar un endpoint/modelo definitivo. No se inventan modelos ni se ocultan fallos mediante fallback mock. El endpoint usa Node runtime, límite de 10 MB, máximo 25 MP/10 000 px por lado, timeout abortable y respuestas de error uniformes.

## Seguridad

- No hay secretos hardcodeados ni claves `service_role`.
- CSP permite `blob:` y `data:` en imágenes porque el editor usa object URLs, miniaturas y canvas.
- `unsafe-inline` se mantiene para scripts/estilos requeridos por hidratación y estilos dinámicos de Next/React; `unsafe-eval` solo se permite en desarrollo.
- El endpoint registra únicamente metadatos técnicos concisos, nunca buffers, Base64 o tokens.
- El rate limit inicial es en memoria (10 solicitudes/minuto por IP). En serverless no es consistente entre instancias y no constituye una garantía; `DistributedRateLimiter` deja preparado el reemplazo por Upstash/Vercel KV.
- La orientación EXIF depende de la decodificación del navegador. Debe probarse con fotografías de los dispositivos objetivo.

## Pruebas

Las pruebas no requieren Supabase ni APIs externas y cubren:

- HEX, RGB y HSL.
- Geometría y límites de máscaras.
- Validación de uploads y dimensiones.
- Validación/importación y migración de proyectos v1 → v2.
- Normalización de nombres de exportación.
- Selección de provider y timeout.

## Diagnóstico de desarrollo

`/dev/status` muestra versión, provider seleccionado y presencia de capacidades/variables sin revelar sus valores. En producción la ruta responde como 404.

## Despliegue en Vercel

1. Inicia sesión o crea una cuenta en Vercel.
2. Selecciona **Add New → Project** e importa el repositorio existente desde GitHub.
3. Confirma que Vercel detecte **Next.js** y npm.
4. Configura las variables necesarias para cada entorno.
5. Despliega y revisa **Build Logs** y **Runtime Logs**.
6. Verifica la URL `*.vercel.app` asignada.
7. Configura `NEXT_PUBLIC_SITE_URL` con esa URL final, sin slash final.
8. Vuelve a desplegar para regenerar metadata, sitemap y robots con la URL correcta.

Vercel separa **Development**, **Preview** y **Production**. Supabase y los providers pueden permanecer sin configurar en Preview si se usa `mock`. No se necesita `vercel.json`; la integración automática de Next.js es suficiente.

### Dominio personalizado

El dominio `*.vercel.app` está incluido. Opcionalmente, abre **Project Settings → Domains**, agrega un dominio propio y sigue los registros DNS indicados. Vercel emite y renueva HTTPS automáticamente después de validar DNS.

### Preview Deployments

Flujo sugerido para el repositorio existente:

1. Crea una rama de trabajo.
2. Realiza cambios y commits pequeños.
3. Sube la rama al remoto ya configurado.
4. Abre un pull request.
5. Revisa el Preview Deployment generado por Vercel.
6. Fusiona a `main` cuando CI y preview sean correctos.
7. Revisa el deployment de Production.

No ejecutes nuevamente `git init`, `git remote add` ni cambios destructivos de historial en este repositorio.

## CI

`.github/workflows/ci.yml` ejecuta `npm ci`, lint, typecheck, tests y build en push y pull request con Node 22. Usa `WALL_AI_PROVIDER=mock` y no requiere secretos.

## Privacidad

Los proyectos e imágenes se guardan localmente en IndexedDB por defecto. Las imágenes no se guardan en Supabase. Consulta `/privacy` para la explicación completa y revisa el texto antes de publicación final.

## Limitaciones conocidas

- La visualización del color varía por cámara, pantalla, iluminación, acabado y superficie.
- La detección automática no es perfecta; el editor ofrece corrección manual.
- Los providers externos aún no tienen un modelo definitivo conectado.
- IndexedDB depende del navegador/dispositivo y puede eliminarse al limpiar sus datos.
- El rate limit en memoria no se comparte entre instancias serverless.
- `npm audit` reporta actualmente un advisory moderado transitivo en el PostCSS incluido por Next.js 16.2.10. No hay vulnerabilidades altas/críticas y npm no ofrece una actualización compatible; no se fuerza un downgrade o major inseguro. Revisar al actualizar Next.js.

## Próximos pasos

- Elegir y validar un modelo real de segmentación de paredes.
- Sustituir el rate limit en memoria si el endpoint se expone ampliamente.
- Endurecer políticas de paletas o agregar identidad cuando el producto lo requiera.
- Validar UX y política de privacidad con usuarios/dispositivos objetivo.

Consulta [`docs/production-checklist.md`](docs/production-checklist.md) antes del despliegue final.
