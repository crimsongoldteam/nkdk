import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importTypeLinkFromEnterprise } from "./importFromEnterprise"
import { TypeLink } from "./types"

describe("importTypeLinkFromEnterprise", () => {
  it("should import type link without link item", () => {
    const enterpriseValue = "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит"
    const result = importTypeLinkFromEnterprise(mockContext, mockRule, enterpriseValue)

    const expected: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 0,
    }

    expect(result).toEqual(expected)
  })

  it("should import type link with link item", () => {
    const enterpriseValue = "Справочник.КакойТоСправочник.ТабличнаяЧасть.КакаяТоТаблица.Реквизит.КакойТоРеквизит(1)"
    const result = importTypeLinkFromEnterprise(mockContext, mockRule, enterpriseValue)

    const expected: TypeLink = {
      dataPath: "Catalog.КакойТоСправочник.TabularSection.КакаяТоТаблица.Attribute.КакойТоРеквизит",
      linkItem: 1,
    }

    expect(result).toEqual(expected)
  })

  it("should return undefined for undefined input", () => {
    const result = importTypeLinkFromEnterprise(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })
})
