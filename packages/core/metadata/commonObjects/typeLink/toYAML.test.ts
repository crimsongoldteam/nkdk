import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportTypeLinkToYAML } from "./toYAML"
import { TypeLink } from "./types"

describe("exportTypeLinkToYAML", () => {
  it("should export type link without link item", () => {
    const typeLink: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 0,
    }
    const result = exportTypeLinkToYAML(mockContext, mockRule, typeLink)

    expect(result).toEqual("Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит")
  })

  it("should export type link with link item", () => {
    const typeLink: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 1,
    }
    const result = exportTypeLinkToYAML(mockContext, mockRule, typeLink)

    expect(result).toEqual("Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит(1)")
  })
})
