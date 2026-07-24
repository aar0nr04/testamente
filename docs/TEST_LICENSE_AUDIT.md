# Auditoría de licencia de instrumentos

Fecha de revisión: 2026-07-24. Este registro no constituye asesoría legal. Un enlace académico prueba la existencia del instrumento, no el permiso de reproducir reactivos, digitalizarlos, traducirlos ni comercializarlos.

| Instrumento | Titular/fuente a confirmar | Estado | Evidencia primaria u oficial | Acción antes de publicar |
|---|---|---|---|---|
| RSES | Morris Rosenberg / titular editorial | pendiente | [obra original](https://psycnet.apa.org/record/1965-35041-000) | Confirmar permiso digital y las siete adaptaciones. |
| SWLS | Autores/titular de la escala | pendiente | [validación original](https://doi.org/10.1207/s15327752jpa4901_13) | Confirmar licencia comercial, texto y traducciones. |
| SHS | Lyubomirsky y Lepper/titular | pendiente | [validación original](https://doi.org/10.1207/S15327752JPA7801_15) | Obtener permiso de reproducción/adaptación. |
| Ryff | Carol Ryff/titular | pendiente | [publicación original](https://doi.org/10.1007/BF00292643) | Definir la forma y conseguir permiso para ella. |
| BAI | Pearson | restringida | [catálogo Pearson](https://www.pearsonassessments.com/store/usassessments/en/Store/Professional-Assessments/Personality-%26-Biopsychosocial/Beck-Anxiety-Inventory-%7C-BAI/p/100000251.html) | Licencia digital/comercial y entitlement antes de `licensed_production`. |
| STAI | Mind Garden | restringida | [catálogo Mind Garden](https://www.mindgarden.com/145-state-trait-anxiety-inventory-for-adults) | Licencia digital/comercial y control de administraciones. |
| GAD-7 | Autores; NIH CDE | permiso no requerido para el instrumento referenciado | [NIH CDE](https://www.nih.gov/node/19876), [validación](https://doi.org/10.1001/archinte.166.10.1092) | Mantener atribución, revisión clínica y revisión de traducciones. |
| Zung SDS | Autor/titular | pendiente | [publicación original](https://doi.org/10.1016/S0033-3182(65)80070-0) | Identificar titular y permiso digital. |
| PHQ-9 | Pfizer/PHQ Screeners | permiso no requerido según fuente oficial | [NIH CDE](https://cde.nlm.nih.gov/formView?tinyId=myG8MkTbwg), [FAQ Pfizer](https://www.pfizer.com/contact/faqs) | Mantener declaración/atribución aplicable y completar revisión clínica. |
| PSS | Cohen/MAPI Research Trust | permiso requerido | [CMU: proceso ePROVIDE](https://www.cmu.edu/common-cold-project/measures-by-study/psychological-and-social-constructs/stress-measures/perceived-stress.html) | Presentar solicitud gratuita en ePROVIDE/MAPI; las traducciones tienen titulares propios. |
| BFI-44 | John Lab/titular | pendiente | [publicación](https://doi.org/10.1002/(SICI)1097-4679(199906)55:6%3C605::AID-JCLP1%3E3.0.CO;2-7) | Verificar forma, permiso y atribución. |
| TIPI | Gosling, Rentfrow y Swann/titular | pendiente | [publicación](https://doi.org/10.1037/1040-3590.16.2.192) | Confirmar permiso de uso comercial y traducciones. |
| Mini-IPIP | International Personality Item Pool | pendiente de forma exacta | [IPIP](https://ipip.ori.org/) | Verificar que los reactivos seleccionados y la atribución sean los autorizados. |
| EPQ-R-S | Eysenck/Barrett/titular | restringida hasta verificar | [publicación](https://doi.org/10.1080/00223891.1985.10581026) | No incluir texto o baremos sin licencia. |
| Stroop | Protocolo/normas a definir | pendiente | [publicación original](https://doi.org/10.1037/h0054651) | Autorizar formato digital, estímulos y normas aplicables. |
| TMT | Protocolo/normas a definir | pendiente | [fuente histórica](https://apps.dtic.mil/sti/citations/ADA800245) | Autorizar forma digital y normas. |
| Digit Span simple | Testamente (protocolo aún inexistente) | bloqueado de uso clínico | no aplica | Crear y validar protocolo propio, sin afirmar equivalencia WAIS/WMS. |
| CD-RISC-10 | CD-RISC | restringida | [sitio CD-RISC](https://www.cd-risc.com/) | Licencia digital y control de acceso. |
| Brief COPE | Charles Carver/titular | pendiente | [publicación](https://doi.org/10.1207/s15327965pli0401_6) | Confirmar condiciones de reproducción y traducciones. |
| GHQ-12 | GL Assessment | restringida | [GL Assessment](https://www.gl-assessment.co.uk/products/general-health-questionnaire-ghq/) | Licencia digital/comercial y entitlement. |
| AMAS-A | PAR/titular | restringida | [PAR](https://www.parinc.com/) | Entregar sólo mediante canal privado tras licencia, allowlist, caducidad y payload autorizado. |

## Modos obligatorios para contenido restringido

- `review_private`: sólo Custom Claim `professional_reviewer`, `admin` u `owner`; App Check, correo verificado, allowlist con expiración, `noindex`, sin Analytics/respuestas en logs y payload fuera del bundle.
- `licensed_production`: licencia, permiso digital/comercial, entitlement y fecha de vencimiento comprobados por backend. Si expira, el callable no entrega el payload.

La antigua columna Android `access: free` no se considera prueba jurídica y no se usa como autorización.
