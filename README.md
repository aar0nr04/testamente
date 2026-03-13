# Testamente Web

Modern web platform scaffold inspired by the Android app `aar0nr04/PsychologicalTestApp`.

## Stack
- React + TypeScript + Vite
- React Router
- Firebase Web SDK
- JSON-based test definitions + locale files

## Current vertical slice
- Home page
- Login page (Firebase-ready placeholder flow)
- Test catalog
- Test runner
- Result page

## Quick start
```bash
npm install
npm run dev
```

## Migration notes (brief)
- Android Activities/Fragments are mapped to route pages and reusable React components.
- Adapter + RecyclerView patterns are mapped to typed list components (`TestCard` + `.map`).
- ViewModel state logic is mapped to hooks and pure test engine functions.
- Firebase Android SDK integration points are prepared in `src/lib/firebase.ts` for Auth + Firestore.
- XML strings are migrated into locale JSON files (`src/locales/en.json`, `src/locales/es.json`).
- Test definitions are externalized as JSON (`src/data/tests/stress-check-v1.json`).

See `MIGRATION_PLAN.md` for the full mapping and phased plan.

## GitHub Pages
- The repository includes `.github/workflows/deploy.yml` for automatic deploys to GitHub Pages on push to `main`.
- If the site is a project page (`https://<user>.github.io/<repo>/`), Vite base path is configured automatically in CI using `REPO_NAME`.
