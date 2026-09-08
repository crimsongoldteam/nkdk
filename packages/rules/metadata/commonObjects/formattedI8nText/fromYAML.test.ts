import { describe,expect,it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { formattedI8nTextFixtures } from "./__fixtures__/data"
import { importFormattedI8nTextFromYAML } from "./fromYAML"
import { FormattedI8nTextPropertyRule } from "./types"

const formattedI8nTextRule: FormattedI8nTextPropertyRule = {
  type: "FormattedI8nText",
  yaml: "Title",
}

describe("importFormattedI8nTextFromYAML", () => {
  it("restores an omitted default-language text from the name", () => {
    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: {
        type: "FormattedI8nText",
        yaml: "Заголовок",
        excludeIfEqualNameYAML: true,
      },
      value: undefined,
      name: "ФормаЭлемента",
      restoreExcludedEqualName: true,
    })

    expect(result).toEqual({
      formatted: false,
      items: { ru: "Форма элемента" },
    })
  })

  it("imports explicit empty text", () => {
    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: {
        type: "FormattedI8nText",
        yaml: "Заголовок",
        excludeIfEqualNameYAML: true,
      },
      value: { Текст: "" },
      name: "ФормаЭлемента",
    })

    expect(result).toEqual({
      formatted: false,
      items: {},
    })
  })

  it("восстанавливает пустой форматированный текст без языковых значений", () => {
    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: formattedI8nTextRule,
      value: { Форматированный: "Истина" },
    })

    expect(result).toEqual({
      formatted: true,
      items: {},
    })
  })

  describe("value-based YAML", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: fixture.valueYAML,
      })
      expect(result).toEqual(fixture.text)
    })
  })

  describe("игнорирование старого источника", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: fixture.valueYAML,
        source: fixture.textFromStructure,
      })
      expect(result).toEqual(fixture.text)
    })

    it("берёт языки и форматирование только из YAML", () => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: { Форматированный: "Истина", Текст: { en: "Field" } },
        source: { items: { ru: "Поле" } },
      })

      expect(result).toEqual({
        formatted: true,
        items: { en: "Field" },
      })
    })
  })
})
