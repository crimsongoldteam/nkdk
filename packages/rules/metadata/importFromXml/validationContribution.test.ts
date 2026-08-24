import { createXmlAnomalyAnnotations } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { PreparedImportYaml } from "./prepareYaml"
import type { ImportAssignment } from "./types"
import { extractImportValidationContribution } from "./validationContribution"
import type { ValidationProjectFile } from "../validation/projectFiles"
import { createMetadataItemProjectSchemaExporter } from "../projectDefinition/projectSpecHelpers"

describe("extractImportValidationContribution", () => {
  it("профилирует вклад файла терминами архитектуры", () => {
    const measured: string[] = []

    const result = extractImportValidationContribution({
      prepared: preparedCatalogYaml(),
      projectDir: "/project",
      file: validationFile("Справочник/Контрагенты/Свойства.yaml"),
      measure(name, action) {
        measured.push(name)
        return action()
      },
    })

    expect(result.validationContribution.objectIndexEntries).toHaveLength(1)
    expect(measured).toEqual([
      "Сбор ссылок и локальных зависимостей",
      "Сбор сведений о владельцах и полях",
      "Сбор объектов общего индекса",
      "Сбор полей общего индекса",
      "Формирование записей объектов общего индекса",
      "Сбор логических адресов",
    ])
  })

  it("не добавляет неприменимые этапы для формы", () => {
    const measured: string[] = []

    const result = extractImportValidationContribution({
      prepared: preparedFormYaml(),
      projectDir: "/project",
      file: validationFile("Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml"),
      measure(name, action) {
        measured.push(name)
        return action()
      },
    })

    expect(result.validationContribution.memberIndexEntries).toHaveLength(1)
    expect(measured).toEqual([
      "Сбор ссылок и локальных зависимостей",
      "Сбор полей общего индекса",
    ])
  })
})

function preparedCatalogYaml(): PreparedImportYaml {
  const assignment = importAssignment({
    id: "catalog",
    role: "properties",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
  })
  return {
    assignment,
    rule: MetadataCatalogRules,
    targetProjectPath: assignment.targetProjectPath,
    yaml: { Имя: "Контрагенты" },
    annotations: createXmlAnomalyAnnotations(),
    proofAudit: { sources: [], boundaries: [] },
    ownerContext: [],
    localIndexes: {
      metadata: {
        events: [],
        ownerFacts: { attributes: [{ name: "ИНН", type: { type: "String" } }] },
      },
    },
    deferred: [],
    dependentDeferred: [],
    dependentOwner: { dir: "Справочник", name: "Контрагенты" },
    generatedFiles: [],
  }
}

function preparedFormYaml(): PreparedImportYaml {
  const assignment = importAssignment({
    id: "form",
    role: "fileItem",
    targetProjectPath: "Справочник/Контрагенты/Формы/ФормаЭлемента/Форма.yaml",
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress: "Справочник.Контрагенты.Форма.ФормаЭлемента",
    owner: {
      itemType: "MetadataCatalog",
      name: "Контрагенты",
      logicalAddress: "Справочник.Контрагенты",
    },
  })
  return {
    assignment,
    rule: ClientApplicationFormRules,
    targetProjectPath: assignment.targetProjectPath,
    yaml: {},
    annotations: createXmlAnomalyAnnotations(),
    proofAudit: { sources: [], boundaries: [] },
    ownerContext: [],
    localIndexes: { metadata: { events: [], ownerFacts: {} } },
    deferred: [],
    dependentDeferred: [],
    dependentOwner: { dir: "Справочник", name: "Контрагенты" },
    generatedFiles: [],
  }
}

function importAssignment(
  params: Omit<ImportAssignment, "topologyAddress" | "xmlFiles" | "externalFiles">,
): ImportAssignment {
  return {
    ...params,
    topologyAddress: { nodeId: params.id, values: {} },
    xmlFiles: [],
    externalFiles: [],
  }
}

function validationFile(projectPath: string): ValidationProjectFile {
  const form = projectPath.endsWith("/Форма.yaml")
  const rule = form ? ClientApplicationFormRules : MetadataCatalogRules
  return {
    componentPath: "cf",
    componentDir: "/project",
    rootProjectPath: `cf/${projectPath}`,
    absolutePath: `/project/${projectPath}`,
    projectPath,
    kind: form ? "form" : "properties",
    topologyNodeId: form ? "catalog-form" : "catalog",
    itemType: rule.itemType,
    owner: {
      dir: "Справочник",
      name: "Контрагенты",
      spec: {
        dir: "Справочник",
        kind: "metadataItem",
        rule: MetadataCatalogRules,
        exportSchema: createMetadataItemProjectSchemaExporter(MetadataCatalogRules),
      },
    },
    ...(form ? { formName: "ФормаЭлемента" } : {}),
    itemRule: rule,
    metadataTarget: {
      canonical: form
        ? "Catalog.Контрагенты.Form.ФормаЭлемента"
        : "Catalog.Контрагенты",
      owner: { root: "Catalog", objectName: "Контрагенты" },
    },
    logicalAddress: form
      ? "Справочник.Контрагенты.Форма.ФормаЭлемента"
      : "Справочник.Контрагенты",
  }
}
