# Plan de migración ejecutado

La auditoría real sustituyó el plan previo. Se auditó `PsychologicalTestApp` en una copia temporal de solo lectura: Manifest, 18 Activities, Kotlin, assets, modelos, strings y llamadas Firebase.

Fases implementadas: fundación Firebase web; AuthProvider y guards; catálogo basado en `assets/tests/index.json`; runner secuencial y motor multiescala; persistencia canónica y fallback legacy; perfiles, directorio, citas, planes; reglas, configuración y CI.

Pendiente de configuración externa: registrar aplicación Web Firebase, credenciales, App Check, backend callable de IA/contenido licenciado, roles con Custom Claims y despliegue de reglas.

Los detalles y evidencia están en `docs/MIGRATION_AUDIT.md`, `docs/ANDROID_WEB_PARITY.md` y `docs/KNOWN_LIMITATIONS.md`.
