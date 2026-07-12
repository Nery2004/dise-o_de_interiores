# Checklist manual de estabilización

Ejecutar en Chrome y, antes de una entrega pública, repetir el bloque esencial en Safari/Firefox. Registrar navegador, sistema, tamaño de viewport, proyecto y resultado.

## Imagen y canvas

- [ ] Abrir `/editor`, cargar una imagen válida de 1920×1080. **Esperado:** aparece completa, sin deformación, y el estado cambia a “Listo”.
- [ ] Probar zoom con controles, rueda modificada y “tamaño real”. **Esperado:** el punto focal se conserva y no se pierde por completo la imagen.
- [ ] Activar Mano y arrastrar; cambiar de herramienta durante el gesto y provocar `pointercancel` saliendo de la ventana. **Esperado:** no queda el canvas arrastrando ni se activa otra herramienta.
- [ ] Cargar 3000×2000 y 4000×3000. **Esperado:** edición utilizable y original intacto. Intentar una dimensión mayor de 5000 px. **Esperado:** mensaje claro y rechazo seguro.

## Máscaras, pintura y Base Blanca

- [ ] Crear máscara manual, cerrarla con Enter y cancelarla con Escape. **Esperado:** un solo polígono válido o cancelación sin residuos.
- [ ] Ejecutar detección automática con proveedor disponible y sin proveedor. **Esperado:** máscara editable o mensaje de indisponibilidad; nunca panel roto.
- [ ] Mover uno y varios puntos, usar flechas/Shift+flechas y deshacer. **Esperado:** una entrada lógica por gesto y coordenadas alineadas con la imagen.
- [ ] Refinar con Añadir/Quitar; terminar, cancelar y cambiar de herramienta a mitad del trazo. **Esperado:** captura liberada, sin pincel atascado; un trazo completo se deshace una vez.
- [ ] Aplicar color, intensidad, feather, blend y Base Blanca auto/manual. **Esperado:** preview inmediato, textura y sombras conservadas; undo/redo restaura valores.

## Comparador

- [ ] Probar divisor vertical y horizontal con pintura y objetos. **Esperado:** ambas mitades mantienen exactamente zoom, pan, proporción y origen.
- [ ] Arrastrar, cancelar el puntero y cambiar de modo. **Esperado:** el divisor deja de arrastrarse, sin saltos ni activación de selección.
- [ ] Exportar comparación. **Esperado:** incluye imagen editada real, no controles ni paneles.

## Objetos, perspectiva, iluminación y capas

- [ ] Colocar un objeto transparente, mover, redimensionar con/sin proporción, rotar y voltear. **Esperado:** centro, bounding box y asset permanecen alineados; una entrada de historial por gesto.
- [ ] Crear selección múltiple y marco; cancelar el marco. **Esperado:** selección correcta y rectángulo eliminado al soltar/cancelar.
- [ ] Crear superficie, mover puntos, asignar objeto y usar transformación libre. **Esperado:** superficie y objeto comparten coordenadas; cuadriláteros inválidos no se guardan.
- [ ] Ajustar horizonte, profundidad y z-order. **Esperado:** anclaje y contacto se conservan, sin aplicar escala dos veces.
- [ ] Analizar iluminación, ajustar perfil y sombras, bloquear un objeto. **Esperado:** solo objetos Auto no bloqueados cambian; undo/redo funciona dentro de iluminación.
- [ ] Agrupar, desagrupar, ocultar, bloquear, reordenar y eliminar superficie/grupo. **Esperado:** IDs y referencias quedan limpios; elementos ocultos no se exportan.

## Proyectos y propuestas

- [ ] Guardar un proyecto con imagen, dos máscaras refinadas, Base Blanca, objetos agrupados, superficies, luz y propuestas; recargar la página. **Esperado:** round-trip sin pérdida y URL temporal recreada.
- [ ] Importar proyectos de fixtures/esquemas v1–v6. **Esperado:** migración secuencial a v7; una versión futura o datos estructuralmente corruptos se rechazan.
- [ ] Borrar máscara/objeto/grupo/superficie seleccionados y guardar. **Esperado:** ninguna selección o referencia obsoleta reaparece al cargar.
- [ ] Crear, duplicar, aplicar y comparar propuestas. **Esperado:** snapshots independientes; aplicar restaura pintura, objetos, grupos, superficies y luz.
- [ ] Desactivar IndexedDB o llenar la cuota. **Esperado:** estado vacío/aviso accionable y mensaje en español, sin stack trace para el usuario.

## Exportación

- [ ] Exportar: solo pintura; solo objetos transparentes; pintura+objetos; propuesta; comparación. **Esperado:** PNG válido a resolución original.
- [ ] Repetir con sombras, perspectiva, grupos, objeto oculto y selección activa. **Esperado:** respeta visibilidad/z-order; no aparecen handles, guías, selecciones ni UI.
- [ ] Comparar píxeles visualmente entre preview y PNG al 100 %. **Esperado:** composición equivalente; solo antialias/calidad de objetos puede variar mínimamente.
- [ ] Forzar asset ausente. **Esperado:** error útil “No se pudo cargar uno de los objetos”, sin descarga parcial.

## Responsive, accesibilidad y errores

- [ ] Probar 1440×900, 1024×768, 768×1024 y 390×844. **Esperado:** canvas visible, toolbar/paneles alcanzables, sin controles fuera del viewport.
- [ ] Navegar botones, sliders y comparador con teclado. **Esperado:** foco visible, labels/aria útiles, flechas operativas y Escape cierra modos compatibles.
- [ ] Escribir en input, textarea, select y contenteditable mientras se pulsan Cmd/Ctrl+Z, Delete, Backspace y flechas. **Esperado:** el editor no intercepta el texto y Backspace no navega cuando actúa sobre selección del editor.
- [ ] Abrir/cerrar diálogos con botón, Escape y clic exterior cuando esté permitido. **Esperado:** fondo bloqueado durante modal y foco recuperable; no queda un drag activo.
- [ ] Revisar consola durante los flujos. **Esperado:** sin errores, 404, warnings repetitivos ni logs temporales.
- [ ] En desarrollo, abrir el panel “Diagnóstico del editor” y luego `/dev/status`. **Esperado:** métricas sin secretos: conteos, interacción, zoom, caché, worker y últimos tiempos.
