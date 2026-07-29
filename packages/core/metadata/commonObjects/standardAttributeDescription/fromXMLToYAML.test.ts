import { describe, expect, it } from "vitest"
import type { PropertyRule } from "../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { allYAML } from "./__fixtures__/data"
import { StandartAttributeNameToYAML } from "./types"

const rule: PropertyRule = {
  type: "StandardAttributeDescriptions",
  yaml: "СтандартныеРеквизиты",
  standartAttributeNames: StandartAttributeNameToYAML,
}

describe("StandardAttributeDescriptions XML → YAML", () => {
  it("exports all.xml directly to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path: "all.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ СтандартныеРеквизиты: allYAML })
  })

  it.each(["minimal.xml", "default.xml"])("omits defaults from %s", (path) => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path,
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({})
  })

  it("exports multiple.xml directly to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
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

  it("exports empty reference fill value without losing its type", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: undefined,
      path: "fillValueEmptyRefTypeLoss.xml",
      xmlRootTag: "StandardAttributes",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({
      СтандартныеРеквизиты: {
        Ссылка: {
          ЗначениеЗаполнения: ".",
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
