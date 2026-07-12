# Reporte de auditoría técnica

## Alcance revisado

Se inspeccionaron rutas App Router, providers/contextos, tipos, IndexedDB e importación/exportación de proyecto, APIs de detección, transformaciones y coordenadas, render de pintura/objetos, comparación, exportación, listeners, timers, RAF, worker, cachés, dependencias y configuración TypeScript.

## Hallazgos por prioridad

| Prioridad | Hallazgo | Resolución |
|---|---|---|
| Crítico | Archivo rastreado `decor-placement-context 2.tsx` divergente y excluido de TypeScript | Eliminado; se retiró la exclusión que ocultaba duplicados futuros |
| Alto | Migraciones saltaban desde cada versión a v7 y mezclaban defaults | Cadena pura v1→v2→…→v7 con pruebas de inmutabilidad |
| Alto | Referencias de máscara, grupo, superficie y luz podían quedar colgantes | Saneador puro al cargar, antes de validación final |
| Alto | Undo de objetos interceptaba Cmd/Ctrl+Z dentro de campos editables | Predicados de teclado compartidos y guardas de foco/defaultPrevented |
| Alto | Cancelación de marco dejaba estado visual activo; capturas podían sobrevivir cambios de herramienta | Limpieza localizada de pan, objetos, superficies, puntos y pincel |
| Medio | Conversiones viewport→imagen repetidas | Funciones canónicas y tipos explícitos compartidos, con pruebas |
| Medio | Worker singleton sin cierre y caché limitada solo por cantidad | `dispose`, estado diagnóstico y LRU con límite de 48 entradas/96 MiB |
| Medio | Sin tiempos observables de render/export | Monitor solo desarrollo, panel del editor y última muestra en `/dev/status` |
| Bajo | Errores de exportación dependían de strings técnicos | Códigos tipados y mensajes de usuario centralizados para export/asset/cuota |

## Riesgos pendientes deliberados

- El historial continúa separado por dominios y no garantiza cronología global entre pintura, objetos e iluminación.
- No se añadió Playwright/Cypress: no existía infraestructura y sumarlo habría introducido tecnología y mantenimiento nuevos. La cobertura actual es unitaria/integración pura más checklist manual.
- La vista interactiva de objetos usa composición DOM/CSS mientras exportación usa Canvas; la geometría y datos son compartidos, pero perspectiva/antialias complejos pueden diferir levemente.
- Presentación se apoya en miniaturas de propuesta y no es una reproducción ultra en vivo.
- La detección automática depende de configuración/proveedor y sus resultados son heurísticos.
- La prueba manual multi-navegador, táctil y de memoria real sigue siendo requisito de release.

## Dependencias

No se agregaron, actualizaron ni eliminaron paquetes. Cada dependencia declarada tiene uso localizado; no se justificó alterar el lockfile en una fase conservadora.
