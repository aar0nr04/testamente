# Permisos administrativos y staff

`users/{uid}.role` sólo distingue `patient` y `psychologist`. Los claims `owner`, `admin` y `professional_reviewer` se leen del token. `staffAccess/{uid}` es un registro administrativo de backend y no es una fuente de autorización.

`setStaffPermissions` sólo acepta llamadas de `owner`, consulta o actualiza `admin`/`professional_reviewer`, conserva claims ajenos y jamás concede/revoca `owner`. Por ello un admin no puede convertirse en owner y el último owner no pierde el acceso mediante esta ruta. Un vencimiento opcional se replica como `staff_expires_at` en el token y se valida en cliente, Rules y Functions; `staffAccess` sólo conserva la evidencia administrativa. Todo cambio deja auditoría y obliga a renovar token.

Para operaciones break-glass de owner, usar Application Default Credentials y el script local documentado en `ADMIN_CLAIMS.md`; `--dry-run` permite revisar el merge propuesto sin escribir claims.
