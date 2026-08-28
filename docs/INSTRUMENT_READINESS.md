# Estado de ejecución y publicación de instrumentos

Auditoría actualizada el 27 de agosto de 2026. Este registro distingue contenido técnicamente ejecutable de una autorización clínica o de publicación. Ningún cambio de esta entrega convierte un instrumento en público ni modifica aprobaciones clínicas.

## Recorrido que sí está conectado

El catálogo público sólo inicia instrumentos con `published: true`. El chequeo corto propio sigue disponible para comprobar el recorrido completo: instrucciones → respuestas → puntuación → resultado → caché/sincronización.

GAD-7 y PHQ-9 en español tienen sus reactivos y algoritmo conectados al mismo motor, pero permanecen sin publicar. Se prueban desde `/professional-review` con correo verificado, App Check habilitado y Custom Claim `owner`, `admin` o `professional_reviewer`. No hay elevación de permisos desde el navegador. RSES sólo está disponible para esa revisión con el idioma inglés seleccionado: no se ha etiquetado una traducción automática al español como validada.

Una respuesta positiva en el ítem 9 de PHQ-9 muestra de inmediato el aviso de seguridad. En México incluye 911 y la [Línea de la Vida](https://www.gob.mx/conasama/articulos/linea-de-la-vida-800-911-2000?idiom=es), gratuita y disponible 24/7; fuera de México indica usar el número local de emergencias. La aplicación no contacta emergencias ni sustituye apoyo profesional.

## Matriz de los 20 instrumentos solicitados

| Instrumento | Contenido por idioma | Algoritmo | Prueba funcional | Revisión profesional | Público | Evidencia y siguiente acción |
|---|---|---|---|---|---|---|
| RSES | EN original técnico; ES no implementado | Sí, suma 0–30 e inversos 3/5/8/9/10 | Sí, protegida | Sí (EN) | No | [UMD](https://socy.umd.edu/about-us/using-rosenberg-self-esteem-scale) declara dominio público; falta revisión clínica y traducción ES trazable. |
| SWLS | No | No | No | No | No | [Sitio del autor](https://eddiener.com/satisfaction-with-life-scale-swls/) limita su uso gratuito a investigación no comercial; obtener autorización comercial y traducción. |
| SHS | No | No | No | No | No | [Validación](https://doi.org/10.1207/S15327752JPA7801_15); confirmar permiso de reproducción digital y traducciones. |
| Ryff | No | No | No | No | No | [Publicación](https://doi.org/10.1007/BF00292643); definir primero la forma exacta (18/42/54/84/120) y sus derechos. |
| BAI | No | No | No | No | No | [Pearson](https://www.pearsonassessments.com/store/usassessments/en/Store/Professional-Assessments/Personality-%26-Biopsychosocial/Beck-Anxiety-Inventory-%7C-BAI/p/100000251.html); licencia digital y entitlement antes de cualquier payload. |
| STAI | No | No | No | No | No | [Mind Garden](https://www.mindgarden.com/145-state-trait-anxiety-inventory-for-adults); es de licencia, no cargar reactivos ni baremos al bundle. |
| GAD-7 | ES y EN técnicos; otros idiomas en revisión, no utilizables | Sí, técnico | Sí, protegida | Sí | No | [NIH CDE](https://www.nih.gov/node/19876) y [validación](https://doi.org/10.1001/archinte.166.10.1092); falta revisión clínica, de rangos y de traducciones. |
| Zung SDS | No | No | No | No | No | [Publicación](https://doi.org/10.1016/S0033-3182(65)80070-0); identificar titular y permiso digital. |
| PHQ-9 | ES y EN técnicos; otros idiomas en revisión, no utilizables | Sí, técnico + alerta ítem 9 | Sí, protegida | Sí | No | [NIH CDE](https://cde.nlm.nih.gov/formView?tinyId=myG8MkTbwg) y [FAQ Pfizer](https://www.pfizer.com/contact/faqs); completar revisión clínica y protocolo de seguridad antes de publicar. |
| PSS-10 | No | No | No | No | No | [CMU/MAPI](https://www.cmu.edu/common-cold-project/measures-by-study/psychological-and-social-constructs/stress-measures/perceived-stress.html) exige trámite de permiso; no usar textos de terceros. |
| BFI-44 | No | No | No | No | No | [Publicación](https://doi.org/10.1002/(SICI)1097-4679(199906)55:6%3C605::AID-JCLP1%3E3.0.CO;2-7); confirmar forma, licencia y atribución. |
| TIPI | No | No | No | No | No | [Página oficial de Gosling](https://gosling.psy.utexas.edu/scales-weve-developed/ten-item-personality-measure-tipi/) permite uso, pero falta incorporar el original de forma trazable y validar subescalas/traducciones antes de exponerlo. |
| Mini-IPIP | No | No | No | No | No | [IPIP](https://ipip.ori.org/); escoger la forma exacta y documentar sus reactivos/atribución antes de implementar. |
| EPQ-R-S | No | No | No | No | No | [Publicación](https://doi.org/10.1080/00223891.1985.10581026); bloquear contenido hasta confirmar derechos de la versión corta. |
| Stroop | No; requiere estímulos/UI | No | No | No | No | [Original](https://doi.org/10.1037/h0054651); definir autorización, protocolo temporizado y normas. |
| TMT | No; requiere gráfica/UI | No | No | No | No | [Fuente histórica](https://apps.dtic.mil/sti/citations/ADA800245); confirmar forma digital, cronometraje y normas. |
| Digit Span simple | No; protocolo propio pendiente | No | No | No | No | Crear y validar protocolo propio sin afirmar equivalencia WAIS/WMS. |
| CD-RISC-10 | No | No | No | No | No | [CD-RISC](https://www.cd-risc.com/); licencia digital, controles de acceso y baremos autorizados. |
| Brief COPE | No | No | No | No | No | [Publicación](https://doi.org/10.1207/s15327965pli0401_6); confirmar uso digital y traducciones de los 28 reactivos. |
| GHQ-12 | No | No | No | No | No | [GL Assessment](https://www.gl-assessment.co.uk/products/general-health-questionnaire-ghq/); licencia comercial y entitlement. |

AMAS-A se conserva fuera de esta matriz porque no forma parte de los 20 solicitados: continúa únicamente como diseño de canal privado, sin reactivos incorporados ni publicación.

## Garantías de datos y resultados

- El runner usa `instrumentEngine` para todo instrumento con algoritmo, incluida la comprobación local; el motor legacy ya no calcula resultados del runner activo.
- Cada resultado persiste `instrumentId`, versión del instrumento, versión de algoritmo, versión de contenido, idioma, respuestas y totales. No se registra ningún campo `undefined`.
- La caché del navegador está aislada por `uid` (y una partición `anonymous`), de modo que cambiar de cuenta no revela resultados anteriores.
- Las reglas permiten únicamente crear `users/{uid}/testResults/{id}` con `createdAt` del servidor; actualización y borrado están denegados. El cliente comprueba si un id ya existe en un reintento y no usa `merge`.
- Ante caída de Firebase se navega al resultado y se informa que sólo quedó almacenado localmente; no se vuelve a intentar como actualización.

## Gates que siguen pendientes

Para publicar uno de estos instrumentos hacen falta el permiso aplicable, contenido completo del idioma, casos de validación de puntuación, revisión técnica, revisión clínica, recursos de seguridad cuando apliquen y el cambio auditable de la versión por backend. Un `featureFlag` o la existencia de contenido no salta estos gates.
