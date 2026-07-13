# Reporte final de cierre — 0.9.0-rc.1

Fecha: 2026-07-12 (America/Guatemala)  
Commit base revisado: `9249e26c7af640ffc62828476a05be00bcb78cb7`  
Rama: `main`  
Estado inicial: worktree limpio  
Versión propuesta: `0.9.0-rc.1`, canal `release-candidate`

## Recomendación

**Listo como RC técnico interno y para crear un Preview Deployment. No listo para Production pública/comercial.**

No hay bloqueantes técnicos conocidos en build, rutas, mock, pintura, proyectos básicos u exportación dentro de la cobertura ejecutada. Sí hay bloqueantes de publicación: licencia/procedencia de assets no demostrada, ausencia de Preview real/multinavegador y falta de términos/canal privado de seguridad aprobados por el propietario.

No se hizo commit, tag, push, merge, deploy, cambio de variables Vercel ni borrado de datos.

## Estado funcional

- Stable: landing, carga/validación, canvas, zoom/Mano, comparador, máscaras manuales/edición, mock, pintura, Base Blanca, PNG, proyectos locales/importación, catálogo y colocación básica de objetos.
- Beta: pincel táctil, propuestas, Supabase opcional, perspectiva/superficies, sombras, grupos/capas, presentación y móvil.
- Experimental: iluminación automática, deshabilitada por defecto.
- Disabled: providers externos, oclusión automática y developer tools en producción.
- Planned: oclusión y funciones futuras fuera del RC.

## Cambios de consolidación

- Versión sincronizada en `config/app.ts`, `package.json` y lockfile.
- Canal de release y flags centralizados con defaults seguros.
- IA externa bloqueada en UI y API; provider inválido falla cerrado.
- Perspectiva avanzada gobernada por flag Beta.
- Iluminación automática bloqueada en lógica/UI, conservando datos existentes.
- Esquema v7 nombrado explícitamente y pipeline de objetos versionado en la caché.
- Cinco pruebas nuevas de configuración, versionado, provider y fixture portable; total 128.
- Fixture final v7 validado sin mutación con imagen sintética propia, máscara pintada en Base Blanca, objeto, superficie, perspectiva, sombra, iluminación y propuesta.
- El mismo fixture atraviesa el importador portable real; su exportación y recorrido E2E quedan indicados en el checklist de Preview porque no existe runner E2E en el repositorio.

## Problemas y deuda

- P0 publicación: assets de `public/` sin evidencia de licencia; términos y canal privado no definidos; Preview real pendiente.
- P1: navegadores/dispositivo físico, round-trip avanzado, políticas Supabase y rate limit distribuido si se habilitan.
- P2: historial global, equivalencia DOM/Canvas, sesión prolongada, dataset fotográfico y advisory PostCSS.
- No se eliminó código o assets: ningún candidato podía retirarse con evidencia suficiente. Los TODOs de providers se conservaron y documentaron porque describen conectores deshabilitados reales.

## Variables finales

Obligatoria al publicar: `NEXT_PUBLIC_SITE_URL` con el dominio confirmado. Default seguro: `WALL_AI_PROVIDER=mock`, `NEXT_PUBLIC_ENABLE_EXTERNAL_WALL_AI=false`, `NEXT_PUBLIC_ENABLE_AUTOMATIC_LIGHTING=false`, perspectiva Beta activa. Supabase y tokens son opcionales; las variables públicas exigen rebuild/redeploy.

## Seguridad, privacidad y licencias

- Escaneo de archivos rastreados: sin tokens, private keys ni credenciales; coincidencias de `service_role` son advertencias documentales.
- Variables de tokens solo aparecen en `.env.example` y módulos server-only.
- Uploads, MIME, dimensiones, JSON portable, timeout, cancelación, rate limit, no-store, CSP y errores sin stack están activos.
- `npm audit`: 2 moderadas de una cadena Next→PostCSS; 0 altas/críticas. No existe fix compatible verificado y no se usó `--force`.
- `/privacy` ahora explicita IndexedDB, backend mock, terceros, cookies/analítica inexistentes y logs técnicos.
- No existe `LICENSE`; no se eligió una automáticamente.
- Fixtures sintéticos declarados propios; assets de catálogo/landing/demo quedan con licencia desconocida y bloquean publicación.

## Accesibilidad, navegador y móvil

- Resultado previo real: Lighthouse 100/100 en accesibilidad y buenas prácticas para seis rutas.
- Probado: Chrome 150 headless, macOS Intel, seis viewports 320×568–1440×900.
- No probados: lector de pantalla real, Safari, Firefox, Edge ni hardware táctil.
- Desktop Chrome es recomendado; tablet/móvil permanecen Beta.

## Servicios y pipelines

- Supabase: opcional, falla cerrado con configuración ausente/malformada; políticas públicas MVP requieren revisión antes de habilitarlo ampliamente.
- IA: mock estable para flujo, no medida de precisión. Providers externos deshabilitados y 503; input no contractual 400.
- Pintura: pipeline 1.3.0, Base Blanca y export Ultra estables dentro de fixtures/flujo validado.
- Objetos: pipeline de render 1.0.0; colocación básica/export estable, perspectiva/sombras Beta.
- Proyectos: schema v7, migración v1→v7 e importación segura; fixture portable avanzado validado estructuralmente, recorrido E2E en navegador pendiente.
- Exportación: PNG de pintura y composición probado previamente en Chrome; escenas grandes/multinavegador pendientes.

## Resultados finales

| Control | Resultado |
|---|---|
| `npm ci` Node 22 | pasa; 378 paquetes instalados |
| `npm run lint` | pasa sin warnings después de limpieza final |
| `npm run typecheck` | pasa |
| `npm test` | pasa, 128/128 |
| `npm run build` | pasa, 12 páginas, Next 16.2.10 |
| `npm run start` | pasa, listo en 330 ms en la última ejecución |
| Rutas | seis principales 200; `/dev/status` y ruta inexistente 404 |
| API mock | 200, tres paredes |
| API externa apagada | 503 localizado |
| Provider inválido | 400 localizado |
| E2E | no configurado; no se afirma ejecución Playwright/Cypress |
| Bundle | landing 45.0 KiB; editor 727.9 KiB; 826.6 KiB únicos |
| Benchmarks nuevos | no ejecutados: CloudKit/FileProvider consumían >100 % CPU cada uno |

Los resultados históricos reproducibles de benchmarks permanecen en `reports/`. No se sobrescribieron con tiempos contaminados ni se cambiaron baselines.

## Documentación creada/actualizada

README, changelog, release notes, auditoría inicial, resumen de readiness, matriz final, arquitectura, deuda, licencias, accesibilidad, navegadores, bundle, roadmap, criterios 1.0, checklists Preview/Production, contribución, seguridad y plantillas GitHub. Se actualizó privacidad y `.env.example`.

## Inventario del cambio

- Código/configuración: `config/app.ts`, `config/featureFlags.ts`, API y selector de providers, paneles de detección/perspectiva/iluminación/diagnóstico, versión de render de objetos, constantes del esquema y estado de desarrollo.
- Producto/legal informativo: landing documental en README, `/privacy`, variables de ejemplo y matriz de compatibilidad.
- Pruebas: `tests/release-config.test.ts` y `tests/fixtures/release-candidate-project.json`.
- Metadatos: `package.json` y `package-lock.json` sincronizados en `0.9.0-rc.1`.
- Documentación y comunidad: archivos enumerados arriba, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md` y plantillas de issues/PR.

## Archivos eliminados

Ninguno.

## Commit y tag sugeridos — no ejecutados

Revisar primero:

```bash
git status
git diff
```

Después, si el diff y bloqueantes aceptados son correctos, agregar exclusivamente los archivos listados por `git status` (no `.env`, datos ni reportes locales), y ejecutar:

```bash
git commit -m "release: prepare v0.9.0-rc.1"
git tag -a v0.9.0-rc.1 -m "Interior Color Studio v0.9.0-rc.1"
git push
git push origin v0.9.0-rc.1
```

El tag debe crearse después de aprobar el commit; si cambia el RC, no reutilizar un tag ya publicado.

## Preview, Production y rollback

1. El usuario hace push de una rama/PR; Vercel genera Preview.
2. Confirmar commit/variables y completar `vercel-preview-checklist.md` en navegadores/dispositivo reales.
3. Resolver assets, términos/canal y cualquier bug P0/P1.
4. Merge a la rama de producción solo con Preview aprobado; Vercel despliega desde GitHub.
5. Completar `vercel-production-checklist.md`, dominio, HTTPS, logs, metadata y monitoreo.
6. Rollback: Vercel Deployments → deployment estable → Promote/Rollback; verificar variables, dominio y smoke test. Documentar causa mediante `fix/*`.
