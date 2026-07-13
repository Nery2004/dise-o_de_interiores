# Checklist de Preview Deployment

## Preparación

- [ ] Revisar `git status` y `git diff`; excluir `.env`, descargas y reportes locales no deseados.
- [ ] Confirmar versión/commit/rama y que CI pasa con Node 22.
- [ ] Confirmar build de Vercel y que las variables pertenecen al entorno **Preview**.
- [ ] Mantener `WALL_AI_PROVIDER=mock`, IA externa e iluminación automática apagadas.
- [ ] Usar una URL canónica de Preview solo para esa validación; no inventar Production.

## Variables

| Variable | Pública/privada | Obligatoria | Entornos | Propósito |
|---|---|---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | pública | sí al publicar | Preview/Production | metadata, sitemap, robots |
| `NEXT_PUBLIC_SUPABASE_URL` | pública | no | según decisión | paletas opcionales |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | no | según decisión | acceso público con RLS |
| `NEXT_PUBLIC_ENABLE_EXTERNAL_WALL_AI` | pública | no | todos | default false |
| `NEXT_PUBLIC_ENABLE_ADVANCED_PERSPECTIVE` | pública | no | todos | función Beta |
| `NEXT_PUBLIC_ENABLE_AUTOMATIC_LIGHTING` | pública | no | todos | default false |
| `WALL_AI_PROVIDER` | privada | no | todos | default mock |
| `WALL_AI_TIMEOUT_MS` | privada | no | todos | timeout 1–60 s |
| tokens de provider | privadas | no en RC | solo entorno autorizado | conectores externos futuros |

Modificar variables requiere un nuevo deployment; las `NEXT_PUBLIC_*` se congelan en build.

## Smoke test

- [ ] `/`, `/editor`, `/projects`, `/colors`, `/objects`, `/privacy` y una 404.
- [ ] Header, menú móvil, CTA, FAQ, footer, privacidad, metadata y Open Graph.
- [ ] Cargar JPEG, PNG y WebP; cancelar selector y probar archivo inválido.
- [ ] Zoom, Mano y resize sin mover/desalinear capas.
- [ ] Comparador 0/50/100, vertical/horizontal, mouse/teclado/touch.
- [ ] Mock, cancelación, 429/offline y reintento sin perder imagen.
- [ ] Máscara manual/edición/pincel, color y Base Blanca.
- [ ] Importar `tests/fixtures/release-candidate-project.json`, guardar, recargar, abrir y volver a exportar el proyecto; confirmar máscara, Base Blanca, objeto, perspectiva, sombra y propuesta.
- [ ] Colocar/mover objeto, perspectiva Beta, capas y sombras persistidas.
- [ ] Exportar pintura, objetos y composición; sin handles/guías/UI.
- [ ] Consola sin errores críticos; Network sin 404/500 inesperados; CSP sin bloqueos.
- [ ] Chrome, Safari, Firefox, Edge y al menos un dispositivo físico.

## Aprobación

Registrar URL exacta, commit, navegador/dispositivo, resultado, capturas y logs relevantes sin secretos. No aprobar si hay pérdida de datos, exportación rota, pantalla blanca, desalineación o assets sin licencia para el alcance público.
