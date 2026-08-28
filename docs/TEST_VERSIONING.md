# Versionado inmutable

Una versión se crea sólo desde `publishInstrumentVersion` y contiene snapshot, checksum SHA-256, `sourceDraftId`, versiones de contenido/algoritmo/locales, release notes y metadatos de publicación. Las reglas no permiten escribir en `versions` desde navegador.

Una versión publicada no se modifica. Una corrección se registra en `changeRequests`, apunta a la versión base y propone un borrador nuevo. Retirar una versión cambia su estado a `withdrawn` mediante Function y no borra el snapshot ni los resultados existentes.

Las decisiones legales y de release se registran mediante `recordProjectApproval`, una callable de admin/owner que impide que el autor apruebe su propio proyecto. Las decisiones técnicas, clínicas y de traducción conservan separación de funciones mediante el rol del colaborador y las reglas de Firestore.

Los resultados deben conservar `instrumentId`, `versionId`, `contentVersion`, `algorithmVersion` y `localeVersion`; el modelo actual ya conserva versiones de contenido/algoritmo y debe migrar los resultados históricos a `versionId` al activar publicaciones propias.
