import { describe, expect, it } from "vitest"
import type { PropertyRule } from "../../ruleRuntime"
import { testExportPropertyModelThroughXMLToYAML } from "../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import { mockContextFromXML } from "../../../tests/mockContext"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { XML_PRESENT_TAG_VALUE, yamlScalarTagAt } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
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

  it("помечает присутствующую дефолтную коллекцию пустым !xml", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { ...rule, standartAttributeNames: { PredefinedDataName: "ИмяПредопределенныхДанных" } },
      value: undefined,
      path: "minimal.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ СтандартныеРеквизиты: XML_PRESENT_TAG_VALUE })
    expect(serializeYAMLDocument(result).text).toBe("СтандартныеРеквизиты: !xml/present")
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

  it("помечает отсутствующие канонические элементы через !xml/absent", () => {
    const itemRule = {
      itemType: "StandardAttributeAbsenceProbe",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames: {
            Code: "Код",
            Description: "Наименование",
            ExchangeDate: "ДатаОбмена",
          },
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      rule: itemRule,
      xml: {
        StandardAttributes: {
          "xr:StandardAttribute": {
            _name: "Code",
            "xr:FillChecking": "ShowError",
          },
        },
      },
    }).yaml

    expect(serializeYAMLDocument(imported).text).toContain("ДатаОбмена: !xml/absent")
    expect(serializeYAMLDocument(imported).text).toContain("Наименование: !xml/absent")
  })

  it("exports empty reference fill value without losing its type", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule: { ...rule, standartAttributeNames: { Ref: "Ссылка" } },
      value: undefined,
      path: "fillValueEmptyRefTypeLoss.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      СтандартныеРеквизиты: {
        Ссылка: {
          ЗначениеЗаполнения: "!xml/value DesignTimeRef",
        },
      },
    })
  })

  it.each([
    ["Code", "Код", "xs:string", "String"],
    ["ValueType", "ТипЗначения", "v8:TypeDescription", "TypeDescription"],
  ] as const)("переносит пустой %s FillValue в !xml %s", (xmlName, yamlName, xsiType, marker) => {
    const itemRule = {
      itemType: "StandardAttributeFillValueTransportProbe",
      properties: {
        standardAttributes: {
          ...rule,
          xml: "StandardAttributes",
          standartAttributeNames: { [xmlName]: yamlName },
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      rule: itemRule,
      xml: {
        StandardAttributes: {
          "xr:StandardAttribute": {
            _name: xmlName,
            "xr:FillValue": { "_xsi:type": xsiType },
          },
        },
      },
    }).yaml

    expect(serializeYAMLDocument(imported).text).toContain(`ЗначениеЗаполнения: !xml/value ${marker}`)
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
