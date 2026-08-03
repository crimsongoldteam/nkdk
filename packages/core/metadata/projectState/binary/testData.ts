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
  diagnosticMessage = "Ошибка",
): ProjectStateYamlFileUpdate {
  const update = yamlUpdate(projectPath, componentPath, canonical)
  const owner = { kind: "Справочник", name: canonical }
  const typeInfo = { kinds: ["scalar"] as const, nextTypes: [] }
  return {
    ...update,
    localValidation: {
      contributedFacts: true,
      diagnostics: [
        { line: 1, col: 1, severity: "error", source: "cross-file", message: diagnosticMessage },
        { line: 2, col: 3, severity: "warning", source: "external-file", message: `${diagnosticMessage}: вторая` },
      ],
      schemaDiagnostics: [],
    },
    pendingReferences: [{
      yamlPath: ["Ссылка"],
      canonical: "Catalog.Товары",
      target: { kind: "object", root: "Catalog", objectName: "Товары" },
      constraint: { kind: "object" },
    }],
    owners: [{ owner, facts: { registerType: "InformationRegister" } }],
    fields: [
      {
        owner,
        name: "Код",
        kind: "attribute",
        typeInfo,
        targetName: "КодСсылки",
        sourceCollection: "Реквизиты",
        parentName: "Товары",
        table: { kind: "ValueTable" },
        tableHasColumns: true,
      },
      { owner, name: "Описание", kind: "attribute", typeInfo, tableHasColumns: false },
      { owner, name: "Артикул", kind: "attribute", typeInfo },
    ],
    forms: [{
      kind: "root",
      owner,
      name: "Объект",
      source: { kind: "formAttribute", name: "Объект", typeInfo },
    }],
    pendingChecks: [{
      kind: "dataPath",
      location: { line: 4, col: 5, path: "/ПутьКДанным" },
      yamlPath: ["ПутьКДанным"],
      owner,
      value: "Объект.Код",
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    }],
    dependencies: ["Catalog.Товары"],
  }
}
