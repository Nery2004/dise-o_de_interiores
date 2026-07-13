# Checklist de Production Deployment

Vercel desplegará al recibir push/merge a la rama de producción configurada. No se necesita deploy manual si la integración GitHub está activa.

## Antes

- [ ] `main` contiene únicamente el commit revisado y CI está verde.
- [ ] Preview del mismo commit aprobado y logs revisados.
- [ ] Licencias/procedencia de assets resueltas para el alcance público.
- [ ] Changelog, release notes, privacidad y términos/canal de seguridad aprobados.
- [ ] URL/dominio canónico confirmado; configurar `NEXT_PUBLIC_SITE_URL` con ese valor real.
- [ ] Variables de **Production** revisadas sin copiar valores a documentación.
- [ ] Supabase decidido; si está activo, schema/RLS/políticas aplicados y probados.
- [ ] Provider decidido: mantener mock y flag externo false para este RC.
- [ ] Secretos configurados solo si una función aprobada los necesita.
- [ ] Tag/commit de estabilidad identificados y deployment anterior disponible.

## Verificación en Vercel

- [ ] Deployment muestra commit y rama correctos.
- [ ] Build Logs sin warnings nuevos ni secretos.
- [ ] Function Logs de `/api/detect-walls` sin stacks/datos sensibles.
- [ ] Domains muestra dominio esperado y HTTPS válido.
- [ ] `/`, editor, API mock, proyectos locales y exportación funcionan.
- [ ] Metadata, Open Graph, favicon, sitemap y robots usan dominio correcto.
- [ ] 404, privacidad, responsive y dispositivo móvil revisados.
- [ ] Console/Network sin errores críticos, assets 404 ni bloqueos CSP.

## Después

- [ ] Registrar URL, deployment ID, commit, hora y persona que verificó.
- [ ] Durante las primeras horas/días revisar errores, Functions, latencia, 429, exportaciones, assets, proyectos y feedback por navegador.
- [ ] No añadir analítica invasiva para monitorear; usar logs técnicos mínimos y reportes voluntarios.

## Rollback

1. Abrir el proyecto en Vercel → **Deployments**.
2. Localizar el último deployment estable verificado.
3. Usar **Promote** o **Rollback** según las opciones disponibles del proyecto.
4. Verificar que las variables de Production siguen siendo las esperadas.
5. Probar dominio, landing, editor, API, proyecto local y exportación.
6. Abrir un `fix/*`, documentar la causa y actualizar el changelog; no reescribir historial compartido.

## Hotfix

Crear `fix/descripcion`, aplicar una corrección pequeña, ejecutar toda la validación, obtener Preview, revisar, fusionar y verificar Production. No mezclar funciones nuevas dentro del hotfix.
