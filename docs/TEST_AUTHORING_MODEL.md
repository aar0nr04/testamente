# Modelo de autoría de instrumentos

`instrumentProjects/{instrumentId}` representa la propiedad y el workflow; no contiene una lista grande de reactivos.

```text
instrumentProjects/{instrumentId}
  collaborators/{uid}
  drafts/{draftId}
    questions/{questionId}
  validationCases/{caseId}
  reviewThreads/{threadId}
  changeRequests/{changeRequestId}
  approvals/{approvalId}
  versions/{versionId}
```

Los `originType` distinguen instrumentos oficiales/licenciados, públicos, originales de plataforma, psicólogo, institución, adaptación y traducción. `rightsMetadata` conserva titular, licencia, territorialidad, contrato, atribución, originalidad y autorización de publicación; nunca se asume que una obra creada por un psicólogo pertenece a Testamente.

Un borrador tiene revisión optimista, contenido/algoritmo declarativos y preguntas independientes. La UI no ejecuta JavaScript de usuario. Los roles de colaborador (`owner`, `author`, `editor`, reviewers, translator y viewer) se resuelven desde los documentos de proyecto, no con Custom Claims.
