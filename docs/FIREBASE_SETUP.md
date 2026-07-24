# Configuración de Firebase

## Estado implementado

- Auth: email/contraseña, verificación, recuperación de contraseña y Google Sign-In están conectados en cliente cuando la configuración existe.
- Firestore, Storage y Functions se inicializan sólo si están presentes las seis variables requeridas. Si falta una, el cliente muestra el nombre exacto de la variable y no crea una aplicación Firebase con valores ficticios.
- App Check usa reCAPTCHA v3 cuando existe `VITE_FIREBASE_APPCHECK_SITE_KEY`.
- Los emuladores están definidos en `firebase.json`: Auth `9099`, Firestore `8081`, Functions `5001` y Storage `9199`. Usar `VITE_USE_FIREBASE_EMULATORS=true` sólo en desarrollo.
- `functions/src/index.ts` entrega payloads privados exclusivamente mediante callable con App Check, Custom Claims, allowlist con expiración, configuración de licencia y auditoría sin contenido.

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar sólo valores no secretos públicos del SDK web:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_APPCHECK_SITE_KEY=
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_USE_FIREBASE_EMULATORS=false
VITE_AMAS_PUBLIC_ENABLED=false
VITE_AMAS_REVIEW_ENABLED=false
```

`VITE_AMAS_PUBLIC_ENABLED` debe permanecer en `false`. `VITE_AMAS_REVIEW_ENABLED=true` sólo corresponde a staging autorizado; la Function requiere además `AMAS_REVIEW_ENABLED=true` en su entorno de servidor.

## REQUIERE ACCIÓN DEL PROPIETARIO

1. Firebase Console → **Project settings** → **Your apps** → **Web app** → copiar cada configuración del SDK a `.env.local`/secretos del entorno. No usar el `mobilesdk_app_id` Android.
2. Firebase Console → **Authentication** → **Sign-in method** → activar **Email/Password** y **Google**; en **Settings → Authorized domains** añadir el dominio de staging y `testamente.app`.
3. Firebase Console → **App Check** → registrar la app web → seleccionar reCAPTCHA Enterprise o v3 → copiar únicamente el site key público a `VITE_FIREBASE_APPCHECK_SITE_KEY`; activar enforcement de Auth, Firestore, Storage y Functions después de probar staging.
4. Firebase Console/CLI con Admin SDK controlado por el propietario → asignar Custom Claims `owner`, `admin` o `professional_reviewer`. Ningún flujo del cliente puede asignarlas. Forzar renovación de token tras el cambio.
5. Storage → crear la ruta privada `licensed-test-payloads/amas-a/<versión>.json`. No conceder reglas de lectura al cliente.
6. Firestore mediante Admin SDK → crear `privateInstrumentConfigs/amas-a` con `enabled`, `mode`, `contentVersion`, `algorithmVersion` y `payloadPath`; crear `privateInstrumentAccess/amas-a_<uid>` con `expiresAt`. Proveer al propietario/Functions los reactivos, subescalas, dirección de puntuación, baremos y golden cases autorizados.
7. Functions → configurar `AMAS_REVIEW_ENABLED=true` sólo en staging. Desplegar reglas, índices y Functions desde un entorno autorizado: `firebase deploy --only firestore:rules,firestore:indexes,storage,functions`.

## Validación local y CI

```powershell
npm ci
npm --prefix functions ci
npm run lint
npm run typecheck
npm test
npm run validate:instruments
npm run validate:translations
npm run test:rules
npm --prefix functions run build
npm run build
```

`test:rules` usa Emulator Suite y requiere JDK 17. CI instala Temurin 17 antes de ejecutarlo.
