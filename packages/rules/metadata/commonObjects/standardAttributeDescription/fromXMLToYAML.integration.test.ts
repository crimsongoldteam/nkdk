import { yamlScalarTagAt } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe,expect,it } from "vitest"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"
import { testExportPropertyModelThroughXMLToYAML } from "../../../tests/property/exportPropertyModelThroughXMLToYAML"
import type { PropertyRule } from "../../ruleRuntime"
import { allYAML } from "./__fixtures__/data"
import { StandartAttributeNameToYAML } from "./types"

const rule: PropertyRule = {
  type: "StandardAttributeDescriptions",
  yaml: "СтандартныеРеквизиты",
  standartAttributeNames: StandartAttributeNameToYAML,
}

const allFixtureNames = {
  Owner: "Владелец",
  PredefinedDataName: "ИмяПредопределенныхДанных",
  Code: "Код",
  Description: "Наименование",
  DeletionMark: "ПометкаУдаления",
  Predefined: "Предопределенный",
  Parent: "Родитель",
  Ref: "Ссылка",
  IsFolder: "ЭтоГруппа",
} as const

describe("StandardAttributeDescriptions XML → YAML", () => {
  it("exports all.xml directly to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { ...rule, standartAttributeNames: allFixtureNames },
      value: undefined,
      path: "all.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ СтандартныеРеквизиты: allYAML })
  })

  it("не создаёт маркер для отсутствующей коллекции", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path: "default.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({})
  })

  it("не добавляет транспортный тег при reference-импорте", () => {
    const itemRule = {
      itemType: "StandardAttributeReferenceImportProbe",
      properties: {
        standardAttributes: {
          ...rule,
          xml: "StandardAttributes",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: mockContextFromXML({ forReference: true }),
      rule: itemRule,
      xml: {
        StandardAttributes: {
          "xr:StandardAttribute": { _name: "PredefinedDataName" },
        },
      },
    }).yaml as Record<string, unknown>

    expect(imported).toEqual({
      СтандартныеРеквизиты: {
        ИмяПредопределенныхДанных: {},
      },
    })
    expect(yamlScalarTagAt(imported, "СтандартныеРеквизиты")).toBeUndefined()
  })

  it("exports multiple.xml directly to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: {
        ...rule,
        standartAttributeNames: {
          PredefinedDataName: "ИмяПредопределенныхДанных",
          Predefined: "Предопределенный",
        },
      },
      value: undefined,
      path: "multiple.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      СтандартныеРеквизиты: {
        ИмяПредопределенныхДанных: {
          ПроверкаЗаполнения: "ВыдаватьОшибку",
          Синоним: "Какой-то синоним",
        },
        Предопределенный: {
          Синоним: "Другой какой-то синоним",
        },
      },
    })
  })

  it("exports explicit accounting ExtDimension attributes", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: {
        type: "StandardAttributeDescriptions",
        yaml: "СтандартныеРеквизиты",
        standartAttributeNames: {},
      },
      value: undefined,
      path: "accounting-ext-dimensions.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      СтандартныеРеквизиты: {
        ExtDimension1: {},
        ExtDimensionType1: {},
        ExtDimension50: {},
        ExtDimensionType50: {},
      },
    })
  })
})
