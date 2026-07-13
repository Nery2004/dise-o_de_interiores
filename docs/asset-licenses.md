# Inventario y licencias de assets

Este archivo registra evidencia disponible; ausencia de evidencia significa **no autorizado para publicación pública**, no licencia implícita.

| Grupo | Ubicación | Clasificación | Estado de licencia | Decisión RC |
|---|---|---|---|---|
| Fixtures de paredes | `tests/fixtures/wall-detection/` | sintéticos propios, generados por scripts | declarados propios en README del dataset | permitidos para tests/reportes |
| Fixtures de pintura | `tests/fixtures/paint-rendering/` | sintéticos propios, generados por scripts | declarados propios en README del dataset | permitidos para tests/reportes |
| Proyecto final RC | `tests/fixtures/release-candidate-project.json` | composición técnica portable basada en el fixture sintético `flat-white-wall`; referencia un asset local solo durante la validación | uso interno de pruebas; no es material promocional | permitido para tests de importación y regresión |
| SVG simples de pruebas | `tests/fixtures/*.svg` | fixtures técnicos | sin atribución externa visible; uso solo interno | no usar en marketing |
| Objetos decorativos | `public/decor/` | catálogo/demo | procedencia y autorización no documentadas | bloquear publicación pública hasta verificar/reemplazar |
| Habitación landing y variantes | `public/landing/` | demostración | procedencia y autorización no documentadas | bloquear publicación pública hasta verificar/reemplazar |
| Imagen de estudio | `public/interior-studio-room.png` | demostración | procedencia y autorización no documentadas | bloquear publicación pública hasta verificar/reemplazar |
| Iconos | paquete `lucide-react` | open source | licencia del paquete instalada; conservar notices aplicables | permitido conforme a su licencia |
| Código/dependencias npm | `package-lock.json` | open source | licencias individuales de paquetes; auditoría jurídica no realizada | uso técnico, revisar notices al distribuir |

## Acción requerida

El propietario debe aportar fuente, autor, fecha, licencia y alcance comercial de cada grupo de `public/`. Si no existe evidencia, reemplazar con material propio verificable y actualizar este inventario antes de Production pública. No presentar el catálogo actual como contenido premium licenciado.

No existe `LICENSE` para el repositorio. Elegir una licencia de código requiere autorización del propietario y queda fuera de esta fase.
