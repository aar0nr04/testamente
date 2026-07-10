# Auditoría Android

Fuente auditada: `aar0nr04/PsychologicalTestApp` (copia temporal, solo lectura).

El `AndroidManifest.xml` declara `MainActivity` como launcher y 17 Activities adicionales, incluyendo Login, Register, VerifyEmail, Profile, catálogo/runner nuevos, catálogo/runner legacy, resultados, directorio, citas, IA, configuración y premium. Hay duplicación entre `TestActivity`/`TestRunnerActivity`, `TestListActivity`/`TestsCatalogActivity` y subcolecciones de resultados.

Firebase observado: `users`, `psychologists`, `appointments`, `appointment_requests`, `users/{uid}/appointments`, `chats`, `users/{uid}/testResults`, `users/{uid}/test_results` y `purchases`. Android hace doble escritura de resultados opcionalmente; la web solo escribe el modelo canónico y lee legacy como fallback.

Catálogo real: `assets/tests/index.json` declara 21 instrumentos; solo existe el payload `amas-a/v1/test.es.json`. Android filtra entradas sin payload. AMAS-A está marcado `restricted-or-requires-permission`; por ello la web migra sus metadatos, pero no su contenido al bundle.

Idiomas Android hallados: es, en, fr, pt, it, de y zh. El español es fallback actual de la web para las claves aún no migradas.
