# Revisión profesional en staging

La revisión no se prueba en GitHub Pages ni en producción. GitHub Pages sólo publica `main` y no despliega Functions, reglas ni configuración de App Check. El destino de prueba debe ser un proyecto Firebase de **staging** distinto.

## Preparar el destino

1. Registrar `https://<STAGING_PROJECT_ID>.web.app` (y cualquier dominio de preview utilizado) en Authentication / Authorized domains y en App Check de la aplicación web de staging.
2. Crear un archivo local, ignorado por Git, llamado `.env.staging.local` con los valores públicos `VITE_FIREBASE_*` y `VITE_FIREBASE_APPCHECK_SITE_KEY` de ese proyecto. Mantener `VITE_AMAS_PUBLIC_ENABLED=false` y `VITE_AMAS_REVIEW_ENABLED=false` salvo que exista autorización material específica para AMAS.
3. Iniciar sesión en Firebase CLI con una cuenta que pueda desplegar **ese** proyecto de staging. No se almacenan tokens ni claves en el repositorio.

En Windows PowerShell, desde la raíz del repositorio:

```powershell
npx firebase-tools login --reauth
.\scripts\deploy-staging.ps1 -ProjectId <STAGING_PROJECT_ID> -Staging -Confirm
```

El script exige `-Staging -Confirm`, muestra el proyecto elegido, ejecuta lint, typecheck y pruebas unitarias y despliega reglas, Storage, Functions y Hosting sólo al id indicado. La URL de revisión resultante es exactamente:

```text
https://<STAGING_PROJECT_ID>.web.app/professional-review?instrument=gad-7&locale=es
```

Para PHQ-9 se cambia `instrument=gad-7` por `instrument=phq-9`. RSES está disponible sólo con `locale=en`.

## Dar acceso a una cuenta de revisión

Un owner del proyecto de staging debe obtener primero el UID de la cuenta que usará el revisor. Con Application Default Credentials ya autorizadas para ese proyecto, puede ejecutar:

```powershell
$env:FIREBASE_PROJECT_ID = '<STAGING_PROJECT_ID>'
node .\scripts\set-user-claims.mjs query <UID>
node .\scripts\set-user-claims.mjs grant <UID> professional_reviewer --confirm
```

El segundo comando pide volver a escribir el UID antes de modificar nada y conserva claims que no estén relacionados. No acepta ni guarda contraseñas o claves privadas. La cuenta debe tener el correo verificado y cerrar/abrir sesión después del cambio para renovar su token. El navegador no puede elevar estos permisos.

## Alcance de la revisión

GAD-7 y PHQ-9 se pueden completar en ES y EN; RSES, en EN. El recorrido es instrucciones, respuestas, cálculo y trazabilidad de cada reactivo, seguido de fixtures técnicos ficticios. La aprobación de esos fixtures no aprueba clínicamente un instrumento.

AMAS y otros materiales restringidos siguen bloqueados hasta que exista licencia, payload autorizado y una configuración/allowlist de servidor en staging. Stroop, Trail Making Test y Digit Span se muestran como sin implementar: requieren actividades, protocolos y evidencia específicos, no un cuestionario sustitutivo.
