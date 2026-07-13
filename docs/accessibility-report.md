# Reporte de accesibilidad del RC

No constituye certificación WCAG formal.

## Pruebas ejecutadas

- Lighthouse sobre build `next start` en `/`, `/editor`, `/projects`, `/colors`, `/objects` y `/privacy`.
- Navegación y activación de menú, FAQ y comparador mediante teclado.
- Mouse, teclado y touch emulado en el divisor de landing.
- Seis viewports entre 320×568 y 1440×900.
- Inspección de nombres accesibles, inputs/selects, headings, botones de icono, estados disabled y contraste.

Resultado anterior final: 100/100 en accesibilidad y buenas prácticas para las seis rutas auditadas. La landing pasó de 96 a 100 al corregir contraste/animación.

## Correcciones consolidadas

- Contraste de terracota y grises sobre fondos claros.
- Animación sin atenuar el texto completo.
- Labels para carga, filtros, orden, HEX y regla 60-30-10.
- Nombres accesibles que contienen la etiqueta visible.
- Orden de headings en tarjetas de color.
- Focus visible y controles operables en comparador/acordeones.

## Limitaciones

- No se ejecutó lector de pantalla real (VoiceOver/NVDA/JAWS).
- Presentación no tiene focus trap completo.
- Modales complejos necesitan verificación de retorno de foco.
- Handles de máscaras/objetos y gestos de pincel pueden ser pequeños en touch.
- Canvas es visual; la edición avanzada no tiene una alternativa textual equivalente completa.
- No se probó Safari/Firefox/Edge ni teclado físico móvil.

## Checklist antes de Production

Repetir Tab/Shift+Tab, Enter/Space/Escape, diálogos, drawers, sliders, menús y errores en Preview. Ejecutar VoiceOver en Safari y al menos un lector en Windows; registrar bloqueos sin anunciar cada frame del editor.
