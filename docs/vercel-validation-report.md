# Validación de producción y Vercel

Fecha: 2026-07-12 (America/Guatemala)  
Aplicación: Interior Color Studio 0.2.0  
Commit evaluado: `de3c352bd4b14410779fdc977987b048fe8cb74b`  
Rama: `main`

## Dictamen

El build local equivalente a producción está listo para generar un nuevo Preview Deployment. No se encontraron fallos críticos conocidos en los flujos principales que sí pudieron ejecutarse. La aprobación del deployment real permanece **bloqueada** hasta recibir y probar una URL de Preview o Production de Vercel.

No se hizo push, merge ni deploy; tampoco se modificaron variables de Vercel ni datos reales.

## Información de producción no disponible

No fueron proporcionados:

- URL del Preview Deployment o Production Deployment.
- Captura o mensaje de un error remoto.
- Logs de build o Functions de Vercel.
- Navegador, dispositivo y pasos de una incidencia remota concreta.

Por lo tanto, este reporte no afirma que una URL de Vercel haya sido validada. La validación ejecutada corresponde al repositorio local y a un servidor `next start` construido en modo producción.

## Configuración auditada

| Elemento | Resultado |
|---|---|
| Next.js | 16.2.10, build con webpack |
| Aplicación | 0.2.0 |
| Node declarado | `>=22 <23`; pruebas finales con Node 22.23.1 |
| Rama principal | `main`, siguiendo `origin/main` al comenzar |
| Estado inicial | limpio, sin conflictos ni cambios previos |
| Runtime de `/api/detect-walls` | Node.js, dinámico, duración máxima 30 s |
| Provider predeterminado | `mock` |
| Supabase | opcional; se deshabilita si falta URL o anon key |
| Vercel | sin `vercel.json`; se usan las convenciones de Next.js |
| CSP | activa; permite imágenes `blob:`/`data:` y workers propios/`blob:` |
| Variables obligatorias para modo local/mock | ninguna |

Variables documentadas en `.env.example`:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `WALL_AI_PROVIDER`
- `WALL_AI_TIMEOUT_MS`
- `REPLICATE_API_TOKEN`
- tokens opcionales de los demás providers soportados

El escaneo del repositorio no encontró secretos rastreados. `package-lock.json` coincide con el paquete y usa lockfile v3.

## Entorno y cobertura real

- macOS sobre Intel Core i9.
- Node 22.23.1 para `npm ci`, lint, typecheck, tests, build y servidor de producción.
- Google Chrome 150 headless controlado mediante Chrome DevTools Protocol.
- Viewports: 320×568, 375×667, 390×844, 768×1024, 1366×768 y 1440×900.
- Safari está instalado, pero no se automatizó. Firefox y Edge no se probaron.
- No hay script E2E de Playwright/Cypress configurado en `package.json`; no se inventó un resultado E2E.

Se recorrieron 22 combinaciones de ruta/viewport para Inicio, Editor, Proyectos, Colores, Objetos y Privacidad. No se detectó scroll horizontal, imágenes rotas, excepciones de consola, errores de hidratación ni requests fallidos inesperados.

## Bugs encontrados y corregidos

### VAL-001 — Assertion de rendimiento inestable dentro de una prueba funcional

- Severidad: baja.
- Entorno: Node 22, suite completa concurrente.
- Pasos: `npm test` en una instalación limpia.
- Resultado actual: una ejecución tardó 2057 ms y falló por un límite fijo de 2000 ms; aislada tardó aproximadamente 1.3–1.5 s.
- Resultado esperado: la prueba funcional valida resultado y métricas sin depender de la carga puntual del equipo.
- Causa: el presupuesto de CPU estaba mezclado con una prueba funcional concurrente, aunque ya existen benchmarks dedicados.
- Solución: conservar la validación de la métrica y retirar el umbral temporal duplicado.
- Archivos: `tests/wall-segmentation-pipeline.test.ts`.
- Prueba: suite completa, 123/123.
- Estado: corregido.

### VAL-002 — Contraste insuficiente en la landing

- Severidad: media (accesibilidad).
- Entorno: Lighthouse sobre `next start`.
- Pasos: abrir `/` y ejecutar auditoría de contraste.
- Resultado actual: accesibilidad 96/100; texto terracota con contraste 3.67:1 y texto atenuado por una animación de opacidad.
- Resultado esperado: contraste WCAG AA sin perder la animación ni el branding.
- Causa: color decorativo usado como color de texto y opacidad aplicada al contenedor completo.
- Solución: variante terracota accesible para texto y animación basada únicamente en transformación.
- Archivos: `app/globals.css`, `app/error.tsx`, `app/not-found.tsx`, `components/audience-section.tsx`, `components/how-it-works.tsx`.
- Prueba: Lighthouse de la landing pasó de 96 a 100 en accesibilidad.
- Estado: corregido.

### VAL-003 — Provider global inválido rompía una solicitud mock explícita

- Severidad: media.
- Entorno: API de producción con `WALL_AI_PROVIDER=invalid`.
- Pasos: enviar `POST /api/detect-walls` con `provider=mock`.
- Resultado actual: 500 por validar el provider global al leer únicamente el timeout.
- Resultado esperado: la petición mock explícita debe funcionar y la configuración inválida debe afectar solo al provider que la requiere.
- Causa: acoplamiento entre `getServerEnv()` y la lectura del timeout.
- Solución: parsear `WALL_AI_TIMEOUT_MS` de forma independiente en la ruta.
- Archivos: `app/api/detect-walls/route.ts`.
- Prueba: provider global inválido + solicitud AI devuelve 503 localizado; solicitud mock explícita devuelve 200 y tres paredes. Timeout inválido usa 15 s.
- Estado: corregido.

### VAL-004 — URL de Supabase malformada podía romper la carga del módulo

- Severidad: media.
- Entorno: build/servidor con URL y anon key presentes, pero URL inválida.
- Pasos: configurar `NEXT_PUBLIC_SUPABASE_URL=not-a-url` junto con una anon key.
- Resultado actual: excepción técnica `Invalid supabaseUrl` al crear el cliente.
- Resultado esperado: integración externa deshabilitada sin romper la aplicación.
- Causa: se comprobaba presencia, pero no protocolo ni sintaxis de la URL.
- Solución: normalizar solo URL HTTP/HTTPS válidas; cualquier valor inválido se trata como integración incompleta.
- Archivos: `lib/env/publicEnv.ts`, `tests/production-validation.test.ts`.
- Prueba añadida: URL vacía, malformada, `javascript:` y HTTPS válida; fallback seguro de site URL.
- Estado: corregido.

### VAL-005 — Importación portable admitía SVG y MIME incoherente

- Severidad: media (validación de entrada).
- Entorno: importación de archivos de proyecto.
- Pasos: importar un proyecto cuya imagen declara SVG o cuyo MIME no coincide con el data URL.
- Resultado actual: la validación aceptaba cualquier `image/*` y cualquier prefijo `data:image/`.
- Resultado esperado: solo JPEG, PNG y WebP, con MIME coincidente, límites de tamaño y dimensiones seguras.
- Causa: comprobaciones de prefijo demasiado amplias.
- Solución: allowlist de formatos, prefijo exacto, payload base64 acotado y reutilización de límites de imagen.
- Archivos: `lib/projects/projectValidation.ts`, `tests/production-validation.test.ts`.
- Prueba añadida: rechazo de SVG y MIME incoherente; round-trip portable válido; rechazo de JSON corrupto y versión futura.
- Estado: corregido.

### VAL-006 — Controles sin nombre y contrastes bajos en páginas internas

- Severidad: media (accesibilidad).
- Entorno: Lighthouse sobre Editor, Proyectos, Colores y Objetos.
- Pasos: auditar las rutas en el estado inicial.
- Resultado actual: puntajes de accesibilidad 91, 90, 83 y 96; inputs/selects sin nombre, nombre accesible que no contenía la etiqueta visible, orden de headings y contraste.
- Resultado esperado: controles nombrados y texto AA sin alterar los flujos.
- Causa: labels implícitos ausentes y tonos grises demasiado claros.
- Solución: `aria-label` específico, nombres que incluyen la etiqueta visible, heading correcto, fondo dinámico del HEX y tonos de texto accesibles.
- Archivos: `app/globals.css`, `components/color-card.tsx`, `components/color-library-page.tsx`, `components/decor/decor-object-card.tsx`, `components/editor-context.tsx`, `components/image-uploader.tsx`, `components/projects-client.tsx`.
- Prueba: Lighthouse final dio 100/100 en accesibilidad y 100/100 en buenas prácticas para las seis rutas públicas auditadas.
- Estado: corregido.

## Validaciones funcionales ejecutadas

### Rutas, assets y headers

- `/`, `/editor`, `/projects`, `/colors`, `/objects`, `/privacy`, `/robots.txt`, `/sitemap.xml` y `/opengraph-image`: HTTP 200.
- Ruta inexistente: HTTP 404 con página renderizada.
- Se solicitaron 85 assets referenciados desde HTML, incluidos recursos del optimizador de imágenes: cero 404.
- CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy` presentes.
- No se pudo forzar `app/error`/`global-error` de forma segura; sí compilan dentro del build.

### Landing y responsive

- Header, menú móvil, Escape, FAQ, enlaces y comparador probados.
- Comparador: mouse 58→25, teclado 25→26 y evento táctil →75.
- Antes/después mantienen exactamente el mismo rectángulo antes y después de mover el divisor; solo cambia el recorte.
- Cero overflow horizontal en los seis viewports definidos.

### Editor, IA mock y errores de red

- Carga real de WebP mediante Chrome; detección mock produjo tres máscaras.
- Se aplicó Verde salvia a una máscara y se colocó un sillón beige.
- Cancelación con latencia simulada desbloqueó la UI y mostró confirmación.
- Offline mostró un mensaje comprensible y devolvió la UI al estado listo.
- Rate limit real del endpoint: 429 con `Retry-After` después del límite.
- API final: WebP válido + mock → 200 y tres paredes; GET → 405; JSON → 415; multipart sin imagen → 400.
- No se llamó a providers externos ni se imprimieron tokens.

No se ejecutaron en navegador todos los formatos y fallos posibles: JPEG/PNG, imagen sobredimensionada, respuestas 500/502/504/JSON inválido y resultado vacío quedan en el checklist manual. Los validadores y varios estados están cubiertos por pruebas unitarias, pero eso no se presenta como prueba E2E.

### Canvas, pintura, objetos, proyectos y exportación

- El stage se mantuvo alineado durante carga, detección, pintura y colocación de objeto en el flujo probado.
- La pintura produjo un resultado visible; el benchmark visual mantiene métricas cromáticas, luminancia, textura y sombras.
- Proyecto de prueba guardado en un perfil aislado y recargado: imagen Blob 96×64, tres máscaras, color `#A8B5A2` y un objeto restaurados.
- Se exportó PNG de pintura y posteriormente composición con objeto; ambos generaron archivos y toast de éxito.
- Workers se observaron cargados desde chunks propios, sin 404 ni errores CSP.

El round-trip de navegador ejecutado no incluyó grupos, superficies, iluminación ni propuestas. Sus migraciones, referencias, geometría y snapshots tienen cobertura unitaria, pero el round-trip completo descrito en el checklist queda pendiente de Preview/manual.

### Supabase y matriz de variables

- Sin variables: build y aplicación pasan; provider mock y fallback local.
- Solo URL de Supabase: integración deshabilitada, build pasa.
- Solo anon key: integración deshabilitada, build pasa.
- URL malformada + key: integración deshabilitada después de VAL-004.
- Replicate sin token: error 503 localizado; no se realiza llamada externa.
- Provider inválido: error localizado para AI; mock explícito sigue funcionando.
- Timeout inválido: fallback seguro de 15000 ms.

### Lighthouse y bundle

Lighthouse inicial/final de la landing:

| Medición | Performance | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Inicial | 98 | 96 | 100 | 100 | 911 ms | 2160 ms | 75 ms | 0 |
| Tras corrección de contraste | 97 | 100 | 100 | 100 | 948 ms | 2520 ms | 43 ms | 0 |

Auditoría final enfocada en accesibilidad y buenas prácticas:

| Ruta | Accesibilidad | Buenas prácticas |
|---|---:|---:|
| `/` | 100 | 100 |
| `/editor` | 100 | 100 |
| `/projects` | 100 | 100 |
| `/colors` | 100 | 100 |
| `/objects` | 100 | 100 |
| `/privacy` | 100 | 100 |

El análisis final contiene 825.0 KiB únicos entre nueve rutas. La landing carga aproximadamente 45 KiB de JavaScript de cliente y no incluye el chunk del editor, los workers, el motor de pintura, el exportador ni la biblioteca de objetos.

## Resultado de comandos finales

| Comando | Resultado |
|---|---|
| `npm ci` | pasa con Node 22 |
| `npm run lint` | pasa |
| `npm run typecheck` | pasa |
| `npm test` | pasa, 123/123 |
| `npm run build` | pasa, 12 páginas generadas |
| `npm run start` | pasa, listo en 413 ms |
| E2E | no configurado; validación CDP ejecutada aparte |
| `git diff --check` | pasa |

Los gates cronometrados de pintura y paredes no son concluyentes en esta ejecución: procesos de sincronización de iCloud consumían varios núcleos (aproximadamente 100 % por proceso) y elevaron los tiempos sin cambiar los resultados visuales. El gate de pintura sí pasó una vez con Node 25 antes de aumentar la carga, pero Node 25 no es el runtime declarado. No se actualizaron baselines ni se modificó el motor para ocultar esta condición. Deben repetirse en un runner Node 22 inactivo.

`npm audit` informa dos entradas moderadas de la misma cadena Next.js → PostCSS, [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93). El fix automático propone un cambio mayor inseguro/incompatible. La aplicación no recibe CSS arbitrario de usuarios, por lo que se acepta temporalmente el riesgo sin degradar Next.js.

## Pendientes y limitaciones

| Pendiente | Impacto/riesgo | Workaround | Prioridad/dependencia |
|---|---|---|---|
| Validar URL real de Vercel y Functions logs | Puede haber diferencias de infraestructura o variables no visibles localmente | Crear Preview y repetir checklist inferior | alta; requiere URL/logs del usuario |
| Safari, Firefox, Edge y dispositivo físico | Descarga, Canvas, memoria y gestos pueden diferir | Prueba manual con perfil/datos aislados | alta para Safari; externa |
| Round-trip completo con grupos, superficies, iluminación y propuestas | Persistencia avanzada no comprobada de extremo a extremo en navegador | Cobertura unitaria existente; crear proyecto descartable | media |
| JPEG/PNG y escenarios 500/502/504/JSON inválido | Mensajes/UI no recorridos E2E en esta fase | Checklist manual o harness de red en Preview | media |
| Gestos táctiles avanzados: objeto, resize, rotación y pincel | Chrome emulado no equivale a hardware | Probar teléfono/tablet físico | media |
| Sesión prolongada y borrado total | Riesgo de memoria o ciclo de vida de Object URLs; borrar datos reales estaba prohibido | Perfil aislado y sesión de 30–60 min | media |
| Benchmarks temporales bajo carga | No hay medición de regresión fiable del host actual | Repetir en CI/host inactivo con Node 22 | media |
| Advisory moderado de PostCSS | Riesgo bajo mientras no se procese CSS no confiable | Vigilar actualización estable de Next/PostCSS | baja, upstream |

## Archivos modificados

- `app/api/detect-walls/route.ts`
- `app/error.tsx`
- `app/globals.css`
- `app/not-found.tsx`
- `components/audience-section.tsx`
- `components/color-card.tsx`
- `components/color-library-page.tsx`
- `components/decor/decor-object-card.tsx`
- `components/editor-context.tsx`
- `components/how-it-works.tsx`
- `components/image-uploader.tsx`
- `components/projects-client.tsx`
- `lib/env/publicEnv.ts`
- `lib/projects/projectValidation.ts`
- `tests/production-validation.test.ts`
- `tests/wall-segmentation-pipeline.test.ts`
- `docs/vercel-validation-report.md`

## Checklist del siguiente Preview Deployment

Después de que el usuario haga push:

1. Compartir la URL exacta del Preview y confirmar el commit desplegado.
2. Revisar el build log y los logs de `/api/detect-walls` sin copiar secretos.
3. Abrir las seis rutas y una 404; comprobar consola, Network, CSP, assets y ausencia de hidratación fallida.
4. Repetir en móvil: menú, landing comparator, carga WebP/JPEG/PNG, detección mock, pintura, objeto, guardado, recarga y exportación PNG.
5. Probar configuración sin Supabase y luego el estado real de Supabase; confirmar que un error externo sea localizado.
6. Probar cancelación, offline, 429 y reintento sin perder la imagen.
7. Ejecutar Safari manualmente, con atención a Canvas, descarga, memoria y Object URLs.
8. Crear un proyecto descartable con máscara, Base Blanca, objeto transformado, perspectiva, sombra, propuesta, grupo, superficie e iluminación; guardar, recargar y comparar cada propiedad.
9. Repetir `npm run benchmark:paint:check`, `npm run benchmark:walls:check` y `npm run performance:check` en un runner Node 22 inactivo.

## Comandos sugeridos — no ejecutados

```bash
git status
git diff
git add app/api/detect-walls/route.ts app/error.tsx app/globals.css app/not-found.tsx components/audience-section.tsx components/color-card.tsx components/color-library-page.tsx components/decor/decor-object-card.tsx components/editor-context.tsx components/how-it-works.tsx components/image-uploader.tsx components/projects-client.tsx lib/env/publicEnv.ts lib/projects/projectValidation.ts tests/production-validation.test.ts tests/wall-segmentation-pipeline.test.ts docs/vercel-validation-report.md
git commit -m "fix: resolve production validation issues"
git push
```
