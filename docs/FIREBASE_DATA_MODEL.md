# Modelo Firestore canónico

`users/{uid}` contiene perfil privado y consentimiento. `publicPsychologistProfiles/{uid}` contiene únicamente campos públicos aprobados. `tests/{testId}/versions/{versionId}` contiene metadatos; payloads restringidos viven en `licensedTests/{id}/versions/{version}` o Storage protegido. Los resultados están en `users/{uid}/testResults/{id}`; las citas en `appointments/{id}` y mensajes en `appointments/{id}/messages/{id}`. `entitlements/{uid}` solo lo escribe backend.

Compatibilidad de lectura temporal: `psychologists`, `appointment_requests`, `users/{uid}/appointments`, `users/{uid}/test_results`, `users/{uid}/testResults` y `chats`. No hay triple escritura.
