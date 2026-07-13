# Auditoría inicial del cierre de release

Fecha: 2026-07-12 (America/Guatemala)  
Commit base: `9249e26c7af640ffc62828476a05be00bcb78cb7`  
Rama: `main`, alineada con `origin/main` al iniciar  
Versión inicial: `0.2.0`

## Estado recibido

- El worktree estaba limpio; no había archivos modificados, nuevos ni conflictos.
- El último commit era `9249e26 Pruebas reales en Vercel y corrección controlada de errores`.
- `package.json` y `package-lock.json` declaraban la misma versión, Node `>=22 <23` y lockfile v3.
- No existe `vercel.json`; se usan las convenciones de Next.js 16.2.10 y Vercel.
- CI ya ejecuta instalación limpia, lint, typecheck, tests y build con Node 22.
- La validación anterior dejó 123 pruebas, build de producción correcto y recorridos reales en Chrome headless.
- No existe infraestructura E2E de Playwright/Cypress ni una URL de Vercel confirmada en el repositorio.

## Inventario revisado

### Scripts

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, benchmarks de paredes/pintura/rendimiento/estrés y análisis de bundle. No se encontró un script `test:e2e`.

### Variables documentadas

- Públicas: site URL y par público de Supabase.
- Servidor: provider de paredes, timeout y tokens opcionales de Replicate, Hugging Face y Roboflow.
- El modo seguro existente es `WALL_AI_PROVIDER=mock`; Supabase es opcional.

### Reportes existentes

- Compatibilidad funcional.
- Auditorías técnica, de paredes, pintura y rendimiento.
- Checklists manual y de producción.
- Reportes reproducibles de bundle, rendimiento, estrés, pintura y paredes.
- Validación local de producción/Vercel.

No existían todavía los documentos específicos de arquitectura, compatibilidad de navegador, accesibilidad, licencias, deuda, release notes, criterios 1.0 ni checklists separados de Preview/Production.

## Problemas pendientes consolidados de F6–F11

Las fases anteriores no están etiquetadas dentro del repositorio con IDs F6–F11; se consolidaron sus hallazgos por área para no inventar una correspondencia:

1. Los providers externos son conectores incompletos/placeholders y no deben exponerse como funcionales.
2. Perspectiva, superficies, iluminación automática, presentación y gestos táctiles avanzados carecen de cobertura E2E/multinavegador suficiente.
3. El round-trip completo con grupos, superficies, iluminación y propuestas sigue requiriendo prueba manual en Preview.
4. Preview y exportación comparten pipelines, pero perspectiva/antialias y miniaturas JPEG pueden diferir levemente.
5. El historial continúa separado por dominios y no representa una cronología global perfecta.
6. El rate limit de detección está en memoria y no se comparte entre instancias serverless.
7. Supabase usa políticas públicas de MVP; debe permanecer opcional hasta revisar abuso y gobierno de datos.
8. Safari, Firefox, Edge, dispositivos físicos, sesión prolongada y presión real de memoria no fueron validados.
9. Los benchmarks temporales necesitan repetición en un host Node 22 inactivo.
10. Existe un advisory moderado transitivo de PostCSS sin actualización compatible confirmada.
11. No hay procedencia/licencia documentada para todos los assets decorativos y de demostración.

## Tipos, esquemas y pipelines

- Los tipos canónicos están en `types/`: `WallMask`, `InteriorProject`, `DesignProposal`, `DecorObject`, `PlacedDecorObject`, `PlacementSurface` y `RoomLightProfile`. No se encontraron definiciones de dominio duplicadas en frontend/backend/workers.
- El esquema de proyecto actual es v7 y migra secuencialmente v1→…→v7; las versiones futuras se rechazan.
- Detección de paredes está versionada en 2.1.6 y pintura en 1.3.0.
- El pipeline de objetos no tenía aún una constante de versión en su clave de caché.
- La versión de aplicación solo estaba declarada como 0.2.0 en `package.json`, lockfile y `config/app.ts`; faltaba canal de release.

## Residuos y deuda observados

- Doce comentarios `TODO` describen el trabajo pendiente de los tres conectores externos. No son TODOs resueltos: se conservarán como deuda explícita y la función quedará deshabilitada por defecto.
- No se encontraron `console.log` o `console.debug` en producción. Los únicos logs son el logger estructurado del servidor y un warning de asset local ausente.
- No se encontraron archivos temporales o copias divergentes rastreadas.
- Los dos módulos que `npm ls` marca extraneous provienen del `node_modules` local, no del lockfile; `npm ci` debe limpiar el árbol antes de la validación final.
- No existe `LICENSE`; no se seleccionará una sin autorización del propietario.

## Decisión de alcance

Esta fase preparará `0.9.0-rc.1`, documentación, flags seguros y protecciones de versionado. No se agregará `/terms`: los términos comerciales necesitan revisión del propietario/legal y una página nueva sería contenido jurídico no validado. El pendiente quedará explícito antes de un lanzamiento comercial.
