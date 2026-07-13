# Contribuir

## Preparación

Usa Node 22, `npm ci` y una copia local de `.env.example` únicamente si hace falta. Nunca confirmes secretos, `.env`, imágenes personales o datos exportados de usuarios.

## Flujo

- `main`: producción.
- `feature/*`: cambios funcionales aprobados después del RC.
- `fix/*`: bugs/hotfixes.
- Cambios pequeños, mensaje claro y una corrección por commit cuando sea posible.
- Pull request → CI → Preview de Vercel → revisión → merge.

No mezcles una función nueva con un hotfix. Durante el RC prioriza estabilidad, precisión y experiencia antes de ampliar alcance.

## Validación

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Prueba manualmente el flujo afectado en `npm run start`. Incluye capturas para UI, migraciones para cambios de esquema y medición para rendimiento. Revisa accesibilidad, privacidad y móvil cuando aplique.

## Código y assets

Reutiliza tipos canónicos de `types/`, pipelines versionados y transformaciones de imagen existentes. No introduzcas dependencias sin justificar su necesidad. Todo asset nuevo debe registrar fuente, autor y licencia comercial en `docs/asset-licenses.md`.

Los reportes generados solo se confirman cuando son reproducibles y forman parte de la evidencia; evita archivos grandes locales accidentales.

## Seguridad

No publiques vulnerabilidades explotables, tokens ni datos personales en un issue. Sigue `SECURITY.md` y espera que el propietario defina un canal privado antes de abrir el repositorio públicamente.
