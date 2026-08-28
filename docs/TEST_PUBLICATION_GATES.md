# Gates de publicación

`publishInstrumentVersion` falla si cualquiera de estos controles falta:

- preguntas completas y borrador congelable;
- release notes;
- casos de validación verificados;
- aprobación técnica y clínica;
- aprobación legal cuando el origen/licencia lo exige;
- consentimiento explícito de coautores/colaboradores;
- estado `release_candidate` antes de la publicación;
- originalidad y autorización de publicación declaradas;
- ningún thread bloqueante abierto;
- instrumento no restringido/licenciado para el canal público.

La Function calcula el checksum y actualiza el puntero publicado sin modificar el borrador. Los tests restringidos, incluidos AMAS-A, no satisfacen este flujo público: se mantienen en Storage privado, callable con allowlist, expiración y auditoría.
