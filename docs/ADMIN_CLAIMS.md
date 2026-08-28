# Administración y Custom Claims

`users/{uid}.role` sólo acepta `patient` o `psychologist`. Los permisos `owner`, `admin` y `professional_reviewer` viven exclusivamente en Firebase Authentication Custom Claims y no se pueden asignar desde el navegador ni desde un documento de perfil.

## Script local (Windows PowerShell)

El script `scripts/set-user-claims.mjs` usa Firebase Admin SDK con credenciales locales del propietario. No incluye cuentas de servicio ni secretos.

1. Crea una cuenta de servicio de uso administrativo restringido o inicia Application Default Credentials según la política de la organización.
2. Guarda el JSON fuera del repositorio y define variables sólo para la sesión de PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\ruta-segura\firebase-admin.json'
$env:FIREBASE_PROJECT_ID = 'tu-proyecto-firebase'
npm ci
```

3. Consulta los claims actuales antes de modificarlos:

```powershell
node scripts/set-user-claims.mjs query UID_DEL_USUARIO
```

4. Concede o elimina únicamente el permiso indicado. El flag y la confirmación interactiva son obligatorios; el script conserva cualquier claim no relacionado:

```powershell
node scripts/set-user-claims.mjs grant UID_DEL_USUARIO owner --confirm
node scripts/set-user-claims.mjs grant UID_DEL_USUARIO admin --confirm
node scripts/set-user-claims.mjs grant UID_DEL_USUARIO professional_reviewer --confirm
node scripts/set-user-claims.mjs remove UID_DEL_USUARIO professional_reviewer --confirm
node scripts/set-user-claims.mjs grant UID_DEL_USUARIO admin --confirm --dry-run
```

Tras el cambio, la persona debe cerrar/abrir sesión o renovar su token. El cliente usa `getIdTokenResult()` y nunca considera `profile.role` como autorización administrativa.

## Aprobación profesional

`/admin` sólo es accesible a claims `owner`/`admin` con correo verificado y App Check. Sus decisiones llaman a `reviewPsychologistApplication`, una Cloud Function con App Check obligatorio. La Function actualiza el estado de aprobación y crea o elimina `publicPsychologistProfiles/{uid}` mediante Admin SDK; ese documento contiene únicamente los campos expresamente públicos (teléfono/ubicación sólo con consentimiento), nunca correo, notas privadas, claims ni entitlements.
