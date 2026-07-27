# Workflow profesional de Testamente

## Auditoría inicial

| Área | Reutilizable | Brecha inicial | Riesgo mitigado |
| --- | --- | --- | --- |
| Identidad | `AuthContext`, claims y guards | No había workspace profesional ni permisos por proyecto | No se usa `profile.role` para privilegios internos |
| Perfiles | Perfil editable y Function de aprobación | Faltaban estados completos y envío a revisión | La aprobación sigue siendo server-side |
| Catálogo y motor | Registro, algoritmos y `scoreInstrument` | No había proyecto/draft/versionado de instrumentos propios | No se copia contenido licenciado al bundle |
| Firebase | App Check, Functions, Rules y Emulator tests | Faltaban colaboradores, auditoría común y snapshots | Escrituras administrativas se restringen a Functions |
| Revisión | Runner técnico existente | Faltaban threads, cambios y gates de publicación | Reviewer no obtiene permiso de publicación |

## Flujo real

1. Un psicólogo crea un proyecto `psychologist_original` y un borrador inicial.
2. El owner del proyecto incorpora colaboradores con roles acotados al proyecto.
3. Autor/editor trabaja en `drafts/{draftId}` y `questions/{questionId}` con revisión optimista.
4. Se generan casos de validación, se ejecutan localmente y un reviewer técnico verifica los oficiales.
5. Se crean comentarios y propuestas de cambios para cualquier versión congelada.
6. Las aprobaciones técnica, clínica y, si aplica, legal son independientes del autor.
7. Un admin/owner ejecuta `publishInstrumentVersion`; la Function revisa gates y genera una versión inmutable.

Las acciones de staff, aprobación de perfiles, transición sensible, publicación y retirada se auditan en `auditLogs` y no se realizan mediante escrituras administrativas directas desde React.

## Datos de desarrollo

Los datos de muestra no se cargan en Firebase real. Con los emuladores iniciados, se pueden crear exclusivamente en el proyecto demo con:

```powershell
$env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081'
$env:GCLOUD_PROJECT = 'demo-testamente'
npm run seed:emulator
```

El script falla si no detecta Firestore Emulator o si el proyecto no empieza por `demo-`.

## Límites actuales

La publicación real requiere configuración Firebase/App Check, reviewers con claims y documentos de aprobación/verificación. Los instrumentos oficiales/licenciados permanecen fuera del flujo público y AMAS-A continúa deshabilitado en producción.
