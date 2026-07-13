# Changelog

Los cambios relevantes de Interior Color Studio se documentan aquí siguiendo versionado semántico.

## [Unreleased]

Sin cambios todavía. Durante el RC solo deben entrar correcciones reproducibles, documentación y ajustes de compatibilidad.

## [0.9.0-rc.1] - 2026-07-12

### Added

- Editor de paredes con máscaras automáticas/mock, manuales, puntos y pincel.
- Simulación de pintura perceptual, Base Blanca, comparador y exportación PNG.
- Proyectos IndexedDB v7, migración secuencial, importación/exportación y propuestas.
- Biblioteca local de colores y objetos decorativos, grupos, capas, superficies y perspectiva.
- Benchmarks reproducibles de detección, pintura, rendimiento, estrés y bundle.
- Configuración de release, flags seguros, documentación y checklists de despliegue.
- Fixture portable de proyecto completo con imagen sintética, Base Blanca, objeto, perspectiva, sombra, iluminación y propuesta.

### Changed

- Versión consolidada como `0.9.0-rc.1` y canal `release-candidate`.
- Providers de IA externos e iluminación automática quedan deshabilitados por defecto.
- Perspectiva avanzada queda disponible como Beta mediante flag explícito.
- Preview y exportación comparten pipelines versionados; exportación usa calidad Ultra.

### Fixed

- Alineación de imagen, máscaras, comparador y objetos mediante transformación canónica.
- Validación de URLs opcionales, providers, timeout, MIME, dimensiones y proyectos importados.
- Cancelación y limpieza de interacciones, workers, cachés y Object URLs.
- Accesibilidad de contraste, nombres de controles, headings y navegación principal.
- Persistencia/saneo de referencias y migraciones v1→v7 sin mutar el archivo importado.

### Security

- CSP y headers de endurecimiento en producción.
- Uploads JPEG/PNG/WebP limitados y contenido verificado.
- Tokens solo server-side, logs sin buffers/Base64/tokens y respuestas sin stack traces.
- Rate limit inicial y `Cache-Control: no-store` para detección.

### Performance

- Preview adaptativo, workers persistentes, cachés LRU por bytes, RAF y exportación cancelable.
- Bundle de landing separado del editor y catálogos pesados.

### Deprecated

- Ninguna API pública formal. Los conectores externos incompletos no forman parte del RC soportado.

### Known limitations

- IA externa e iluminación automática no están habilitadas para producción.
- Perspectiva, presentación, propuestas avanzadas y móvil permanecen Beta.
- Safari, Firefox, Edge y hardware táctil requieren validación manual.
- Falta confirmar licencia/procedencia de assets de demostración y catálogo antes de publicación pública.
- Supabase es opcional y sus políticas actuales corresponden a un MVP público sin identidad.
- No existe licencia del repositorio ni términos comerciales aprobados.
