# Resumen de preparación del release

## Dictamen

La propuesta es **0.9.0-rc.1**. El repositorio puede considerarse candidato técnico interno cuando las validaciones finales de esta rama pasen. **No está aprobado para Production pública/comercial** hasta confirmar licencias de assets, términos/canal de seguridad y un Preview real en los navegadores objetivo.

## Clasificación

- Stable: landing, carga/validación, canvas, zoom/Mano, comparador, máscaras manuales/edición, mock, pintura, Base Blanca, PNG, proyectos locales/importación y catálogo/colocación básica de objetos.
- Beta: pincel táctil, propuestas, Supabase opcional, perspectiva/superficies, sombras, grupos/capas, presentación y móvil.
- Experimental: iluminación automática, apagada por defecto.
- Disabled: providers externos, oclusión automática y herramientas de desarrollo en producción.
- Planned: oclusión automática, identidad/nube solo si el producto lo decide; no son parte del RC.

La evidencia por función está en [feature-compatibility-matrix.md](feature-compatibility-matrix.md).

## Riesgos conocidos

1. Procedencia/licencia de assets públicos no demostrada.
2. No existe validación real de Preview/Production ni dominio confirmado.
3. Solo Chrome fue automatizado; Safari/Firefox/Edge y dispositivo físico están pendientes.
4. El fixture portable completo valida importación y conservación estructural; su round-trip avanzado aún no fue completado E2E en navegador.
5. Rate limit no distribuido y Supabase con políticas MVP públicas.
6. Providers externos incompletos; no existe precisión real de IA validada.
7. Advisory moderado de PostCSS pendiente de upstream.

## Requisitos de producción

- Node 22, `npm ci`, CI y build limpios.
- `NEXT_PUBLIC_SITE_URL` con dominio confirmado.
- `WALL_AI_PROVIDER=mock` y providers externos apagados.
- Decisión explícita de Supabase; si se habilita, schema/RLS/políticas revisadas.
- Preview aprobado, assets autorizados, canal privado de seguridad y rollback identificado.

## Resultados consolidados previos

- 128 pruebas después de añadir protecciones y el fixture portable completo del RC.
- Lint y typecheck correctos tras versionado/flags.
- Validación anterior: build y `next start` correctos; seis rutas con Lighthouse 100 en accesibilidad/buenas prácticas; seis viewports sin overflow; mock, pintura, objeto, guardado/recarga y PNG ejecutados en Chrome.
- El resultado definitivo de instalación limpia, build, bundle y benchmarks se añadirá al cierre de esta fase en `final-bundle-report.md` y las notas de release.

## Navegadores y dispositivos

- Probado: Google Chrome 150 headless en macOS Intel.
- Viewports probados: 320×568, 375×667, 390×844, 768×1024, 1366×768 y 1440×900.
- No probado: Safari, Firefox, Edge ni hardware táctil físico.
- Desktop es el entorno recomendado; tablet/móvil son Beta y ofrecen menos área para herramientas precisas.

## Privacidad

El comportamiento y `/privacy` coinciden en lo esencial: proyectos e imágenes se guardan en IndexedDB; Supabase opcional solo maneja paletas; en mock la imagen llega al backend propio para procesamiento y no a un proveedor externo; si un build futuro habilita provider externo, la imagen podría salir a ese tercero. No hay cookies, autenticación, publicidad ni analítica. Los logs de servidor conservan metadatos técnicos, no imagen/Base64/tokens.

Pendiente antes de lanzamiento comercial: revisión jurídica de privacidad/términos, retención del provider elegido y un mecanismo/canal de contacto. No se creó `/terms` sin esa decisión.

## Problemas pendientes priorizados

- P0: licencias/procedencia, Preview real, términos/canal de seguridad antes de publicación.
- P1: Safari/Firefox/Edge, round-trip avanzado, políticas Supabase y rate limit distribuido si se habilitan.
- P2: precisión con dataset real, equivalencia perspectiva/Canvas, cronología global de undo y memoria prolongada.
- P3: ajustes visuales derivados de feedback real.
- P4: funciones futuras; quedan fuera del RC.

Durante el RC no se añaden funciones grandes: solo bugs reproducibles, precisión medible, compatibilidad y documentación.
