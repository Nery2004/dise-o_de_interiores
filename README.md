# Interior Color Studio

Editor web para cargar una fotografía de una habitación, seleccionar paredes, simular colores conservando luz/textura, añadir objetos y exportar propuestas. La versión actual es **0.9.0-rc.1**; no es todavía 1.0.

> Captura de producto: pendiente de confirmar o reemplazar los assets de demostración con material cuya licencia esté documentada. No se publica una URL demo porque no fue confirmada.

## Estado

- Núcleo estable: landing, imagen/canvas, máscaras, pintura, Base Blanca, comparador, exportación, proyectos locales y objetos básicos.
- Beta: propuestas, perspectiva, superficies, sombras, grupos/capas, presentación y experiencia móvil.
- Experimental y apagado: iluminación automática.
- Deshabilitado: providers externos de IA; únicamente mock/refinamiento local forman parte del RC.

Consulta la [matriz completa](docs/feature-compatibility-matrix.md) y el [resumen de preparación](docs/release-readiness-summary.md).

## Stack

- Next.js 16 App Router, React 19 y TypeScript estricto.
- Tailwind CSS 4, Canvas 2D/SVG y Web Workers.
- IndexedDB mediante `idb` para proyectos locales.
- Supabase opcional para paletas.
- Route Handler Node para detección/validación de imágenes.

## Requisitos e instalación

- Node.js 22 (`.nvmrc`; rango `>=22 <23`).
- npm y el `package-lock.json` incluido.

```bash
nvm use
npm ci
npm run dev
```

No se necesita `.env.local` para el modo mock. Copia `.env.example` solo si vas a configurar opciones; nunca confirmes ese archivo ni secretos.

## Variables

| Variable | Tipo | Obligatoria | Propósito |
|---|---|---:|---|
| `NEXT_PUBLIC_SITE_URL` | pública | producción | URL canónica para metadata/sitemap |
| `NEXT_PUBLIC_SUPABASE_URL` | pública | no | URL de Supabase opcional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | no | anon key; nunca `service_role` |
| `NEXT_PUBLIC_ENABLE_EXTERNAL_WALL_AI` | pública | no | default `false`; habilita UI/API externa |
| `NEXT_PUBLIC_ENABLE_ADVANCED_PERSPECTIVE` | pública | no | default `true`; función Beta |
| `NEXT_PUBLIC_ENABLE_AUTOMATIC_LIGHTING` | pública | no | default `false`; función experimental |
| `WALL_AI_PROVIDER` | servidor | no | default `mock` |
| `WALL_AI_TIMEOUT_MS` | servidor | no | 1000–60000; default 15000 |
| `REPLICATE_API_TOKEN` | servidor | no | conector no habilitado en RC |
| `HUGGINGFACE_API_TOKEN` | servidor | no | conector no habilitado en RC |
| `ROBOFLOW_API_KEY` | servidor | no | conector no habilitado en RC |

Las variables públicas se congelan durante el build; modificarlas en Vercel exige un nuevo deployment. Configuración mínima segura:

```dotenv
NEXT_PUBLIC_SITE_URL=https://DOMINIO-CONFIRMADO
WALL_AI_PROVIDER=mock
NEXT_PUBLIC_ENABLE_EXTERNAL_WALL_AI=false
NEXT_PUBLIC_ENABLE_AUTOMATIC_LIGHTING=false
```

No inventes el dominio: usa el asignado realmente por Vercel.

## Comandos

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run start
npm run benchmark:walls
npm run benchmark:paint
npm run benchmark:performance
npm run benchmark:stress
npm run analyze
```

No hay script E2E configurado. Las pruebas actuales son unitarias/integración más recorridos manuales/CDP documentados.

## Arquitectura y estructura

- `app/`: rutas, API, metadata y límites de error.
- `components/`: landing, editor, contexts y paneles.
- `config/`: versión/canal y feature flags.
- `data/`: colores, objetos y contenido.
- `lib/`: pipelines, geometría, persistencia, server y cachés.
- `types/`: contratos canónicos.
- `workers/`: pintura, refinamiento e iluminación.
- `tests/`: pruebas, baselines y fixtures propios declarados, incluido el proyecto portable final `tests/fixtures/release-candidate-project.json`.
- `scripts/` y `reports/`: benchmarks y resultados reproducibles.
- `supabase/`: esquema/políticas opcionales.
- `docs/`: arquitectura, auditorías, release y operación.

Detalle: [docs/architecture.md](docs/architecture.md).

## Proyectos, privacidad y Supabase

Las imágenes, máscaras, objetos y proyectos se guardan localmente en IndexedDB por defecto. Limpiar datos del navegador puede eliminarlos. Supabase solo participa en paletas cuando el par público está completo; las imágenes no se guardan allí.

El esquema actual permite lectura/inserción pública para el alcance MVP. Antes de habilitarlo a gran escala deben revisarse identidad, abuso y gobierno de datos. Consulta `/privacy` y [la revisión de privacidad](docs/release-readiness-summary.md#privacidad).

## IA

El mock es determinista y no representa precisión de un modelo real. Replicate, Hugging Face y Roboflow solo validan configuración; no tienen modelo/endpoint definitivo. El RC bloquea esas solicitudes salvo que un build futuro habilite explícitamente el flag después de validarlas.

## Seguridad

- No hay secretos hardcodeados ni `service_role` en cliente.
- Uploads limitados a JPEG/PNG/WebP, 10 MB y dimensiones seguras.
- CSP, headers, timeout, cancelación, rate limit y respuestas uniformes.
- El rate limit en memoria no es una garantía distribuida en serverless.
- `npm audit` mantiene un advisory moderado transitivo de PostCSS sin fix compatible verificado; no se usa `--force`.

Vulnerabilidades privadas deben reportarse mediante el canal privado que defina el propietario; consulta [SECURITY.md](SECURITY.md).

## Despliegue en Vercel

Vercel detecta Next.js automáticamente; no se necesita `vercel.json`. Una rama/PR genera Preview y el push/merge a la rama de producción configurada genera Production.

1. Ejecuta las validaciones locales.
2. Revisa el diff y abre un PR desde `feature/*` o `fix/*`.
3. Aprueba [el checklist de Preview](docs/vercel-preview-checklist.md).
4. Fusiona solo después de revisión.
5. Ejecuta [el checklist de Production](docs/vercel-production-checklist.md).

No se ha confirmado una URL pública. Configura `NEXT_PUBLIC_SITE_URL` únicamente después de confirmar el dominio.

## Assets y licencia

Los fixtures sintéticos de pintura/paredes están declarados como propios. La licencia/procedencia de los assets en `public/decor`, la habitación de landing y la imagen de estudio no está demostrada en el repositorio; no deben publicarse como catálogo premium ni en un lanzamiento comercial hasta resolver [docs/asset-licenses.md](docs/asset-licenses.md).

El repositorio no incluye `LICENSE`. El propietario debe elegirla antes de permitir uso o contribución pública; no se asignó una automáticamente.

## Limitaciones y roadmap

- La simulación es una referencia: cámara, pantalla, iluminación, acabado y superficie alteran el color real.
- IndexedDB depende del dispositivo y cuota.
- Escenas grandes pueden exceder memoria de Canvas en móviles.
- Compatibilidad oficial actual: Chrome 150 probado; otros navegadores son objetivos pendientes, no soporte confirmado.
- No hay términos comerciales aprobados.

Roadmap breve: corregir bugs reales del RC, licenciar assets, validar navegadores/móvil, completar round-trip avanzado y evaluar un provider solo con dataset/privacidad definidos. Consulta [docs/v1-release-criteria.md](docs/v1-release-criteria.md).
