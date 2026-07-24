# Estado del catálogo de instrumentos

Fecha de auditoría: 2026-07-24. Este documento es el estado operativo, no una afirmación de validez clínica ni de licencia.

## Hallazgos iniciales

- La web heredaba un índice Android, un único cuestionario interno de cuatro preguntas y un motor de suma básico. No había payload de RSES ni una marca `e` que representara español implementado.
- El repositorio Android contiene un índice de 21 instrumentos y un solo payload estructurado completo: AMAS-A (36 reactivos). No contiene pruebas unitarias Kotlin útiles; los archivos legacy `tests.json` y `tests2.json` mezclan cuestionarios incompletos, conteos incompatibles y nombres erróneos. No se usan como fuente de verdad.
- El payload Android de AMAS-A no se copió al repositorio web ni al bundle. Su manifiesto tampoco es JSON válido estricto (incluye sintaxis no JSON), por lo que no es una fuente automatizable sin un payload autorizado.
- `src/data/instruments/registry.ts` es ahora el único registro canónico. `src/engine/instrumentEngine.ts` conserva algoritmo, contenido y traducciones en módulos distintos.

| Instrumento | ID | Preguntas | Licencia/acceso | Implementación | Puntuación | Clínico | Idiomas |
|---|---:|---:|---|---|---|---|---|
| Rosenberg / RSES | rses | 10 | pendiente / revisión privada | bloqueado por licencia | no iniciada | pendiente | faltan 7 |
| SWLS | swls | 5 | pendiente / revisión privada | bloqueado por licencia | no iniciada | pendiente | faltan 7 |
| Felicidad subjetiva / SHS | subjective-happiness-scale | 4 | pendiente / revisión privada | bloqueado por licencia | no iniciada | pendiente | faltan 7 |
| Ryff | ryff | 18* | pendiente / revisión privada | bloqueado por licencia y forma | no iniciada | pendiente | faltan 7 |
| BAI | bai | 21 | restringida / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| STAI | stai | 40 | restringida / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| GAD-7 | gad-7 | 7 | permiso no requerido / no publicado | contenido y algoritmo | validada técnicamente | pendiente | ES/EN técnico; 5 en revisión de traducción |
| Zung SDS | zung-sds | 20 | pendiente / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| PHQ-9 | phq-9 | 9 | permiso no requerido / no publicado | contenido y algoritmo | validada técnicamente | pendiente | ES/EN técnico; 5 en revisión de traducción |
| PSS-10 | pss | 10 | permiso requerido / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| BFI-44 | bfi-44 | 44 | pendiente / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| TIPI | tipi | 10 | pendiente / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| Mini-IPIP | mini-ipip | 20 | pendiente / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| EPQ-R-S | epq-r-s | 48 | restringida / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| Stroop | stroop | UI especial | pendiente / revisión privada | pendiente de protocolo UI | no iniciada | pendiente | no aplicable aún |
| Trail Making Test | tmt | UI especial | pendiente / revisión privada | pendiente de protocolo UI | no iniciada | pendiente | no aplicable aún |
| Digit Span simple | digit-span | UI especial | protocolo propio pendiente | pendiente de protocolo UI | no iniciada | pendiente | no aplicable aún |
| CD-RISC-10 | cd-risc-10 | 10 | restringida / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| Brief COPE | brief-cope | 28 | pendiente / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| GHQ-12 | ghq-12 | 12 | restringida / revisión privada | bloqueado | no iniciada | pendiente | faltan 7 |
| AMAS-A | amas-a | 36 | restringida / revisión privada | canal privado preparado | `pending_reference_data` | pendiente | payload no incorporado |

\* Ryff debe confirmar una forma concreta antes de que el conteo pase a ser definitivo.

## Evidencia técnica disponible

- GAD-7 y PHQ-9 tienen fixtures mínimo, máximo, frontera y alerta de seguridad de PHQ-9; los mismos IDs y resultados numéricos se prueban para `es`, `en`, `it`, `fr`, `de`, `zh` y `pt`.
- El motor prueba ítems inversos, selección múltiple, matrices, valores inválidos, rangos y subescalas con fixture sintético. Los casos de contenido restringido no se sustituyen por datos inventados.
- No hay equivalencia Kotlin automática posible: Android no tiene golden tests Kotlin ni algoritmos independientes reutilizables; sólo AMAS-A contiene una implementación/payload que está legalmente bloqueado. La comparación queda explícitamente pendiente de casos autorizados del propietario.

## Criterio de publicación

`published` permanece en `false` para los 21 instrumentos. Para cambiarlo se requieren, como mínimo, licencia o permiso adecuado, `technical_validated`, `clinical_validated`, revisión de idioma y el feature flag de entorno. Los contenidos de GAD-7/PHQ-9 son revisables por profesionales, pero no se ofrecen en el catálogo público todavía.
