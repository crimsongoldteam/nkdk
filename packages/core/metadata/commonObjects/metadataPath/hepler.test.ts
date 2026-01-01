import { describe, expect, it } from "vitest"
import { convertPath, swapMetadataFieldsRulesKeys } from "./helper"

const mockRules = {
  Catalog: {
    name: "Справочник",
    fields: {
      Attribute: "Реквизит",
      TabularSection: {
        name: "ТабличнаяЧасть",
        fields: {
          Attribute: "Реквизит",
        },
      },
    },
  },
  Enum: "Перечисление",
}

describe("swapMetadataFieldsRulesKeys", () => {
  it("should swap metadata fields rules keys", () => {
    const result = swapMetadataFieldsRulesKeys(mockRules)
    expect(result).toEqual({
      Справочник: {
        name: "Catalog",
        fields: {
          Реквизит: "Attribute",
          ТабличнаяЧасть: {
            name: "TabularSection",
            fields: {
              Реквизит: "Attribute",
            },
          },
        },
      },
      Перечисление: "Enum",
    })
  })
})

describe("convertPath", () => {
  it("should convert path to enterprise", () => {
    const result = convertPath(mockRules, "Catalog.КакойТоСправочник.Attribute.КакойТоРеквизит")
    expect(result).toEqual("Справочник.КакойТоСправочник.Реквизит.КакойТоРеквизит")
  })

  it("should convert path to enterprise with tabular section", () => {
    const result = convertPath(
      mockRules,
      "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит"
    )
    expect(result).toEqual("Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит")
  })
})
