# Checklist de producción

## Configuración

- [ ] Variables públicas configuradas en Vercel.
- [ ] Variables privadas configuradas únicamente en Vercel/server.
- [ ] `NEXT_PUBLIC_SITE_URL` actualizado con el dominio definitivo.
- [ ] Provider de IA definido (`mock` mientras no se habilite uno externo).
- [ ] Tokens privados configurados solo si el provider correspondiente está listo.
- [ ] Entornos Development, Preview y Production revisados.

## Supabase

- [ ] Proyecto de Supabase creado, si se usarán paletas.
- [ ] `supabase/schema.sql` aplicado.
- [ ] RLS habilitado y políticas revisadas.
- [ ] Confirmado que se usa anon key, nunca `service_role` en navegador.
- [ ] Riesgo de lectura/inserción pública del MVP aceptado o mitigado.

## Calidad

- [ ] `npm ci` completado con Node 22 LTS.
- [ ] `npm run lint` exitoso.
- [ ] `npm run typecheck` exitoso.
- [ ] `npm test` exitoso.
- [ ] `npm run build` exitoso.
- [ ] Advisory de dependencias revisado con `npm audit`.
- [ ] Logs de build y runtime revisados sin secretos.

## Revisión funcional

- [ ] Landing y navegación móvil revisadas.
- [ ] Editor probado en móvil y escritorio.
- [ ] Carga y validación de imágenes revisadas.
- [ ] Detección mock revisada.
- [ ] Provider externo revisado con consentimiento visual, si aplica.
- [ ] Exportación en resolución original revisada.
- [ ] Proyectos IndexedDB revisados.
- [ ] Propuestas y comparaciones revisadas.
- [ ] Paletas de Supabase revisadas.
- [ ] Política de privacidad revisada.
- [ ] Endpoint probado con archivos inválidos, grandes y exceso de solicitudes.

## Publicación

- [ ] Preview Deployment revisado.
- [ ] Dominio de Vercel verificado.
- [ ] Dominio personalizado y DNS configurados, si aplica.
- [ ] HTTPS automático confirmado.
- [ ] Favicon y Open Graph revisados.
- [ ] `robots.txt` y `sitemap.xml` revisados con la URL final.
