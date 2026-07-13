# Deuda técnica conocida

| Ubicación | Impacto | Prioridad | Recomendación | Dependencia |
|---|---|---:|---|---|
| `lib/server/wall-ai-providers/{replicate,huggingface,roboflow}Provider.ts` | conectores sin endpoint/modelo/normalización | P1 antes de habilitar IA externa | elegir un único proveedor, contrato, consentimiento, fixtures y pruebas | proveedor/dataset real |
| `lib/server/rateLimit.ts` | límite no compartido entre instancias serverless | P1 si la API se abre públicamente | backend distribuido con TTL y observabilidad | Vercel KV/servicio equivalente |
| historiales de editor, objetos e iluminación | undo global prioriza dominios, no cronología real | P2 | diseñar transacciones globales sin romper esquema | migración/UX |
| preview DOM de objetos vs export Canvas | diferencias leves de perspectiva/antialias | P2 | comparación pixel/visual en navegadores objetivo | Safari/Firefox/Edge |
| presentación mediante JPEG persistido | compresión y falta de render Ultra en vivo | P2 | medir antes de cambiar arquitectura | rendimiento/memoria |
| Supabase `supabase/schema.sql` | lectura/inserción pública apropiada solo para MVP | P1 si se habilita | límites, políticas, propietario de datos y abuso | decisión de identidad/producto |
| IndexedDB local | cuota, limpieza del navegador y falta de sincronización | P2 | mensajes/backup y pruebas de cuota; no añadir nube en RC | navegador |
| catálogo y demos en `public/` | procedencia/licencia no demostrada | P0 antes de publicación pública | obtener autorización o reemplazar por assets verificables | propietario de contenido |
| ausencia de E2E | flujos avanzados dependen de checklist manual | P1 para 1.0 | añadir harness pequeño después del RC, con fixtures propios | decisión de tooling |
| benchmark temporal | sensible a CPU/JIT/carga del host | P2 | runner Node 22 dedicado y guardar hardware | CI |
| PostCSS transitivo de Next | advisory moderado sin fix compatible probado | P2 | vigilar release estable; no forzar downgrade | upstream |
| términos comerciales | no hay página ni revisión jurídica | P0 antes de lanzamiento comercial | definir términos con el propietario/asesoría local | decisión legal |

Los doce `TODO` de providers se mantienen porque describen trabajo real no autorizado en este RC. No hay `FIXME`, `HACK`, logs de depuración ni copias temporales rastreadas que deban eliminarse ahora.
