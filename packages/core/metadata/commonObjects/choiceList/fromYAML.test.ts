import { describe, expect, it } from "vitest"
import {
  emptyValueChoiceList,
  emptyValueChoiceListYAML,
  oneItemChoiceList,
  oneItemChoiceListYAML,
  twoItemsChoiceList,
  twoItemsChoiceListYAML,
} from "./__fixtures__/data"
import type { ChoiceListYAML } from "./types"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importFromYAML } from "../../../yaml/import"
import { importChoiceListFromYAML } from "./fromYAML"

describe("importChoiceListFromYAML", () => {
  it("should return undefined for undefined input", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should import one item choice list", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, oneItemChoiceListYAML)

    expect(result).toEqual(oneItemChoiceList)
  })

  it("should import two items choice list", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, twoItemsChoiceListYAML)

    expect(result).toEqual(twoItemsChoiceList)
  })

  it("should import empty value choice list", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, emptyValueChoiceListYAML)

    expect(result).toEqual(emptyValueChoiceList)
  })

  it("preserves quoted numeric strings and plain numbers from parsed YAML", () => {
    const yaml = importFromYAML<ChoiceListYAML>(
      ["- Представление: 2 знака", '  Значение: "2"', "- Представление: 3 знака", "  Значение: 3"].join("\n")
    )

    const result = importChoiceListFromYAML(mockContext, mockRule, yaml)

    expect(result).toEqual([
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "2 знака" } },
        value: { type: "string", value: "2" },
      },
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "3 знака" } },
        value: { type: "decimal", value: 3 },
      },
    ])
  })

  it("imports root-like string values as string literals", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, [
      { Представление: "Справочник", Значение: "Справочник" },
      { Представление: "Постоянное значение", Значение: "Constant" },
    ])

    expect(result).toEqual([
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "Справочник" } },
        value: { type: "string", value: "Справочник" },
      },
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "Постоянное значение" } },
        value: { type: "string", value: "Constant" },
      },
    ])
  })

  it("keeps importing full metadata references as ref values", () => {
    const result = importChoiceListFromYAML(mockContext, mockRule, [
      { Представление: "Без НДС", Значение: "Справочник.СтавкиНДС.ПустаяСсылка" },
    ])

    expect(result).toEqual([
      {
        type: "formChoiceListDesTimeValue",
        presentation: { items: { ru: "Без НДС" } },
        value: { type: "ref", value: "Catalog.СтавкиНДС.EmptyRef" },
      },
    ])
  })
})
