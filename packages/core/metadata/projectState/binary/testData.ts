import type { ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "../fileUpdate"

export function resourceUpdate(
  projectPath: string,
  componentPath = "cf",
): ProjectStateFileUpdate {
  return { kind: "resource", projectPath, componentPath, resourceKind: "resource" }
}

export function yamlUpdate(
  projectPath: string,
  componentPath: string,
  canonical: string,
): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath,
    resourceKind: "yaml",
    yamlRole: "configuration",
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    references: [{ kind: "object", canonical }],
    pendingReferences: [],
    owners: [{ owner: { kind: "Справочник", name: canonical }, facts: {} }],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

export function richYamlUpdate(
  projectPath: string,
  componentPath: string,
  canonical: string,
): ProjectStateYamlFileUpdate {
  const update = yamlUpdate(projectPath, componentPath, canonical)
  return {
    ...update,
    localValidation: {
      contributedFacts: true,
      diagnostics: [
        { line: 1, col: 1, severity: "error", source: "cross-file", message: "Ошибка" },
      ],
      schemaDiagnostics: [],
    },
    dependencies: ["Catalog.Товары"],
  }
}
