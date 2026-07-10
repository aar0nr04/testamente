# Migración legacy

Haz export de Firestore antes de cualquier escritura. `scripts/migrate-legacy-data.mjs` es dry-run por defecto; `--write --confirm-production-migration` es obligatorio para permitir escritura. La implementación de Admin SDK debe procesar batches idempotentes, conservar documentos fuente, informar conteos y registrar solo IDs/conflictos sin PII.
