# Reglas Firebase

`firestore.rules` protege perfiles privados, resultados, citas y mensajes por UID/participantes; prohíbe cambios de roles, aprobaciones y entitlements desde el cliente. Los perfiles públicos están separados. `storage.rules` limita el avatar a su propietario y bloquea payloads licenciados.

Antes de producción: ejecuta Emulator Suite con dos usuarios para validar aislamiento de resultados, mensajes y citas. Despliega con `firebase deploy --only firestore:rules,firestore:indexes,storage`.
