# Matriz de paridad Android → Web

| Android | Propósito | Ruta web | Estado | Evidencia |
|---|---|---|---|---|
| MainActivity | inicio | `/` | migrado | HomePage |
| LoginActivity/RegisterActivity/VerifyEmailActivity | Auth y verificación | `/login`, `/verify-email` | migrado | AuthProvider + guards |
| TestsCatalogActivity | catálogo jerárquico | `/tests` | migrado | `android-index.json`, filtro de payload |
| TestActivity/TestRunnerActivity | ejecución | `/tests/:testId` | consolidado | TestRunnerPage + testEngine |
| ResultActivity/TestHistoryActivity | resultados | `/results/:id`, `/history` | migrado | resultStore Firestore |
| ProfileActivity | perfil | `/profile` | parcial | ProfilePage; foto pendiente |
| PsychologistDirectoryActivity/Detail | directorio | `/psychologists` | parcial | perfil público; detalle pendiente |
| MyAppointmentRequests/AppointmentDetail | citas/chat | `/appointments` | parcial | creación canónica; detalle/chat pendiente |
| AiTipsActivity | recomendaciones | — | preparado | requiere callable/backend |
| PremiumPlansActivity/BillingManager | planes | `/plans` | migrado seguro | pago desactivado |
| SettingsActivity | preferencias | `/profile` | parcial | locale y consentimiento modelados |

Legacy: `TestListActivity`, `TestActivity` y adapters antiguos no se recrean; su comportamiento se consolida en catálogo y runner. Los contenidos licenciados se mantienen fuera del bundle.
