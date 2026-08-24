import type { ProjectStateFileUpdate, ProjectStateYamlFileUpdate } from "../fileUpdate"

export function resourceUpdate(
  projectPath: string,
  componentPath = "cf",
): ProjectStateFileUpdate {
  return { kind: "resource", projectPath, componentPath, resourceKind: "resource", targets: [] }
}

export function emptyYamlUpdate(
  projectPath: string,
  yamlRole: ProjectStateYamlFileUpdate["yamlRole"] = "configuration",
): ProjectStateYamlFileUpdate {
  return {
    kind: "yaml",
    projectPath,
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole,
    localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
    targets: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
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
    targets: [{ kind: "object", canonical }],
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
      xmlAnomaly: "pending",
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    }],
    dependencies: ["Catalog.Товары"],
  }
}

export function fillValuePendingCheck(): ProjectStateYamlFileUpdate["pendingChecks"][number] {
  return {
    kind: "fillValue",
    yamlPath: ["Реквизиты", "Автор", "ЗначениеЗаполнения"],
    location: { line: 4, col: 5, path: "/Реквизиты/Автор/ЗначениеЗаполнения" },
    itemType: "MetadataAttribute",
    type: { type: ["DefinedType.АвторДействия", "string"] },
    value: { type: "ref", value: "" },
    xmlAnomaly: "pending",
    transport: "DesignTimeRef",
  }
}

export function addressableRequiredPendingCheck(): ProjectStateYamlFileUpdate["pendingChecks"][number] {
  return {
    kind: "addressableRequired",
    yamlPath: ["Реквизиты", "Автор"],
    location: { line: 3, col: 3, path: "/Реквизиты/Автор" },
    canonicalTarget: "Catalog.Товары.Attribute.Автор",
    missing: ["Тип", "Использование"],
  }
}
