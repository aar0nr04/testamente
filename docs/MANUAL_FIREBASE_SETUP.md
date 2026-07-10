# Configuración manual Firebase

Registra una aplicación **Web** separada dentro de `psytst-72f06`; nunca uses el `mobilesdk_app_id` Android. Completa `.env.local` usando `.env.example`, habilita Email/Password y Google, agrega dominios autorizados y despliega `firebase.json`.

Configura reCAPTCHA Enterprise/App Check y coloca su site key en `VITE_FIREBASE_APPCHECK_SITE_KEY`. Asigna `professional_reviewer` y `admin` exclusivamente con Custom Claims/Admin SDK. Crea un backend callable que valide Auth, email verificado, App Check, allowlist, licencia y entitlement antes de devolver payloads o recomendaciones IA.
