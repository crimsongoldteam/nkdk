import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { PreparedImportYaml } from "./prepareYaml"
import { extractImportOwnerFacts } from "./ownerFacts"
import type { ImportAssignment } from "./types"

describe("extractImportOwnerFacts", () => {
  it("reuses ValidationOwnerFacts and ObjectFieldIndex for an imported owner", () => {
    const prepared = preparedYaml({
      assignment: catalogAssignment(),
      rule: MetadataCatalogRules,
      ownerFacts: { attributes: [{ name: "ИНН", type: { type: "String" } }] },
    })

    const facts = extractImportOwnerFacts(prepared)

    expect(facts).toHaveLength(1)
    expect(facts[0]).toMatchObject({
      ref: { kind: "Справочник", name: "Контрагенты" },
      filePath: "Справочник/Контрагенты/Свойства.yaml",
      fieldIndex: {
        fields: expect.any(Map),
        standardAttributeAliases: expect.any(Map),
        diagnostics: expect.any(Array),
      },
    })
    expect(facts[0]?.fieldIndex.fields.has("ИНН")).toBe(true)
  })

  it("does not introduce import-only owner facts for a form", () => {
    const assignment: ImportAssignment = {
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
      xmlFiles: [],
      externalFiles: [],
    }

    expect(
      extractImportOwnerFacts(
        preparedYaml({
          assignment,
          rule: ClientApplicationFormRules,
          ownerFacts: {},
        })
      )
    ).toEqual([])
  })
})

function preparedYaml(params: {
  assignment: ImportAssignment
  rule: PreparedImportYaml["rule"]
  ownerFacts: Record<string, unknown>
}): PreparedImportYaml {
  return {
    assignment: params.assignment,
    rule: params.rule,
    targetProjectPath: params.assignment.targetProjectPath,
    yaml: {},
    ownerContext: [],
    localIndexes: { metadata: { events: [], ownerFacts: params.ownerFacts } },
    deferred: [],
    generatedFiles: [],
  }
}

function catalogAssignment(): ImportAssignment {
  return {
    id: "catalog",
    role: "properties",
    targetProjectPath: "Справочник/Контрагенты/Свойства.yaml",
    itemType: "MetadataCatalog",
    itemName: "Контрагенты",
    logicalAddress: "Справочник.Контрагенты",
    owner: undefined,
    xmlFiles: [],
    externalFiles: [],
  }
}
