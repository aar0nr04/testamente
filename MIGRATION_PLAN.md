# MIGRATION_PLAN

## 1) Android repository analysis (source: `aar0nr04/PsychologicalTestApp`)

> Note: direct network cloning was blocked in this environment, so this first pass uses the common Android architecture patterns indicated by the repository domain (psychological tests + Firebase) and is designed for incremental correction once repository access is available.

### Screens and UI building blocks identified for migration
- **Activities** (expected): splash/main, authentication, test list/catalog, test detail/runner, result/history.
- **Fragments** (expected): reusable sections for question flows, profile/auth panels, and result summaries.
- **RecyclerView + Adapters** (expected): test catalog cards and question/answer options.
- **ViewModel/state patterns** (expected): LiveData/StateFlow for current question index, selected options, and computed score.

### Domain/data concepts identified
- Psychological tests with:
  - metadata (id, title, duration)
  - ordered questions
  - option-based scoring
  - score bands and recommendations
- user sessions and persisted results
- locale-driven strings

### Firebase integration points to migrate
- Authentication (email/password)
- Firestore/Realtime DB for test catalog and user results
- optional Analytics/Crashlytics integration in later phases

## 2) Android -> Web migration map

| Android concept | Web equivalent in Testamente |
|---|---|
| Activity | Route page (`React Router`) |
| Fragment | Reusable component |
| RecyclerView + Adapter | Typed list rendering with `.map()` components |
| ViewModel + LiveData/StateFlow | Hooks + local state + pure domain engine |
| Firebase Android SDK | Firebase Web SDK (`auth`, `firestore`) |
| XML string resources | Locale JSON files (`en.json`, `es.json`) |
| XML layouts | Responsive React components + CSS |
| hardcoded test forms | JSON test definition files |

## 3) Proposed web architecture

- `src/pages/*`: route-level pages (Home, Login, Catalog, Runner, Result)
- `src/components/*`: reusable UI pieces (layout, test cards)
- `src/data/tests/*`: JSON test definitions
- `src/engine/*`: deterministic scoring and result computation
- `src/lib/firebase.ts`: Firebase setup and service exports
- `src/locales/*`: translation dictionaries
- `src/types/*`: shared TypeScript contracts

## 4) Representative test migration (initial)

- Added `stress-check-v1` as a representative multi-question scored questionnaire.
- Structure includes:
  - question list
  - normalized answer options with scores
  - result bands (`low`, `moderate`, `high`)
  - locale keys for English/Spanish
- Engine computes total score and band assignment in `calculateResult`.

## 5) Data model mapping

| Android model (inferred) | Web model |
|---|---|
| `Test` entity | `PsychologicalTest` |
| `Question` entity | `TestQuestion` |
| `AnswerOption` entity | `TestOption` |
| `Result` entity | `TestRunResult` |

## 6) Firebase migration notes

- Move Android `google-services.json` setup to Web env vars:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- Keep auth and persistence behind a thin service layer to avoid page-level SDK coupling.

## 7) Remaining work by phases

### Phase 1 (done in this PR)
- Web scaffold with TypeScript + Router
- Shared layout
- Home/Login/Catalog/Runner/Result vertical slice
- JSON test engine with one representative test
- Locale files (`en`, `es`)
- Migration mapping documentation

### Phase 2
- Connect real Firebase auth and persistence
- Import full test catalog from Android source models
- Add user result history and profile pages
- Add validation and error states

### Phase 3
- Accessibility hardening and analytics
- Admin tools for test management
- Advanced visualization for progress trends
- Full parity pass vs Android domain behavior


## 8) Added post-MVP updates

- Locale handling moved to a shared provider to mimic app-wide Android resource configuration changes.
- Introduced local results history (`/history`) as a web equivalent of a persisted results/list screen.
- Added a result storage module to isolate persistence concerns before moving to Firestore-backed repositories.
