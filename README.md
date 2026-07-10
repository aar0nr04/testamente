# Testamente Web

Migración web de `PsychologicalTestApp`, construida con React, TypeScript, Vite y Firebase Web SDK.

## Ejecutar

1. Copia `.env.example` como `.env.local` y completa la configuración de una aplicación Web de Firebase.
2. Ejecuta `npm ci` y `npm run dev`.
3. Verifica con `npm run lint` y `npm run build`.

La configuración Firebase pública no es un secreto: la protección se basa en Authentication, App Check, Security Rules y backend validado. El contenido de pruebas restringidas no se incluye en el bundle web.

## Estado

- Implementado: autenticación email/Google, verificación, guards, catálogo, runner secuencial, resultado/historial canónico, perfil, directorio, solicitud de cita y planes desactivados.
- Requiere Firebase: credenciales, App Check, reglas desplegadas, perfiles públicos y backend callable para IA y tests con licencia.
- Requiere revisión legal: instrumentos marcados `review_only` o `license_pending`.

Consulta `docs/` para auditoría, modelo, reglas, despliegue y limitaciones.
