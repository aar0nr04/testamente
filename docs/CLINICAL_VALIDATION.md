# Validación clínica y revisiones profesionales

La validación técnica no es validación clínica. Ningún instrumento del registro está publicado.

## Ruta y permisos

`/professional-review` está detrás del guard de cliente para los perfiles `owner`, `admin` y `professional_reviewer`. Las reglas de Firestore y la Function callable aplican la protección real mediante Custom Claims; `professional_reviewer` no puede ser creado ni asignado desde un cliente.

La página muestra la matriz por instrumento/idioma, permite recorrer el contenido disponible, calcular sus escalas, inspeccionar alertas y escribir una revisión en `testProfessionalReviews/{reviewId}` con:

```text
instrumentId, contentVersion, algorithmVersion, locale, reviewerId, status,
questionComments, scoringComments, interpretationComments,
translationComments, generalComments, createdAt, updatedAt
```

Estados aceptados: `pending`, `in_review`, `changes_requested`, `technically_approved`, `clinically_approved`, `rejected`.

## Puerta de publicación

Antes de marcar un instrumento o idioma como `published`, documentar en una revisión:

1. versión de contenido y versión de algoritmo exactas;
2. totalidad, orden y opciones de los ítems;
3. inversión, subescalas, fórmula, mínimos, máximos y fronteras;
4. comparación con casos conocidos autorizados;
5. atribución/licencia vigente para ese modo de acceso;
6. revisión de traducción por profesional competente;
7. mensajes de riesgo y ruta de escalamiento local.

PHQ-9 tiene una alerta técnica para cualquier respuesta positiva al ítem 9. Antes de publicación, la profesional debe aprobar el texto, el flujo de crisis, las referencias locales y el manejo de abandono. Un resultado nunca es un diagnóstico.

## AMAS-A

AMAS-A no está publicado y `VITE_AMAS_PUBLIC_ENABLED=false`. No hay reactivos, subescalas, baremos ni resultados Android en `src`, `public` o el bundle web.

El flujo privado está preparado: la Function descarga un JSON de Storage sólo después de App Check, correo verificado, Claim de reviewer, allowlist no expirada y configuración de licencia. Registra un acceso sin guardar el contenido. Como el propietario no ha aportado los materiales autorizados, el estado actual es `pending_reference_data`; no se inventaron reglas ni golden cases. Al suministrarlos, la profesional podrá ejecutar AMAS-A sólo desde staging/revisión privada y comparar las subescalas/total antes de considerar una licencia de producción.
