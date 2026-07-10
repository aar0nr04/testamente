# Despliegue

GitHub Actions usa Node 20, `npm ci`, lint, typecheck y build. GitHub Pages usa rutas relativas; para rutas internas se recomienda Firebase Hosting, cuya regla SPA está en `firebase.json`. Define los secretos `VITE_FIREBASE_*` en GitHub Actions. Firebase Hosting es preferible para Auth, rewrites y App Check.
