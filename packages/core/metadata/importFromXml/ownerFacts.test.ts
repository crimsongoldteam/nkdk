import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { MetadataItem } from "../orchestration/property/types"
import type { PreparedImportModel } from "./prepareModel"
import { extractImportOwnerFacts } from "./ownerFacts"
import type { ImportAssignment } from "./types"

describe("extractImportOwnerFacts", () => {
  it("reuses ValidationOwnerFacts and ObjectFieldIndex for an imported owner", () => {
    const prepared = preparedModel({
      assignment: catalogAssignment(),
      model: metadataItem({
        itemType: "MetadataCatalog",
        name: "Контрагенты",
        attributes: [{ itemType: "MetadataAttribute", name: "ИНН", type: { type: "String" } }],
      }),
      rule: MetadataCatalogRules,
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
        preparedModel({
          assignment,
          model: metadataItem({ itemType: "ClientApplicationForm", name: "ФормаЭлемента" }),
          rule: ClientApplicationFormRules,
        })
      )
    ).toEqual([])
  })
})

function preparedModel(params: Pick<PreparedImportModel, "assignment" | "model" | "rule">): PreparedImportModel {
  return {
    ...params,
    targetProjectPath: params.assignment.targetProjectPath,
    ownerContext: [],
    generatedFiles: [],
  }
}

function metadataItem(value: Record<string, unknown> & { itemType: string }): MetadataItem {
  return value as MetadataItem
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
