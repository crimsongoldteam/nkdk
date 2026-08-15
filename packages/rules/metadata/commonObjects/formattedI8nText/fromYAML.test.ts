import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "./__fixtures__/data"
import { mockContext } from "../../../tests/mockContext"
import { importFormattedI8nTextFromYAML } from "./fromYAML"
import { FormattedI8nTextPropertyRule } from "./types"
import { parseMetadataYaml, yamlMappingTagOf, yamlScalarTagAt } from "@nkdk/runtime"

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

  it("preserves language anomaly sidecars", () => {
    const parsed = parseMetadataYaml("Текст: !xml/order\n  en: Text\n  ru: !xml/duplicate Текст")
    const value = parsed.data as { Текст: Record<string, string> }

    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      name: "Текст",
      value,
    })!

    expect(yamlMappingTagOf(result.items)).toBe("xml/order")
    expect(yamlScalarTagAt(result.items, "ru")).toBe("xml/duplicate")
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

  describe("merge with source", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: fixture.valueYAML,
        source: fixture.textFromStructure,
      })
      expect(result).toEqual(fixture.text)
    })

    it("should keep source default language and take formatted from YAML value", () => {
      const result = importFormattedI8nTextFromYAML({
        context: mockContext,
        rule: formattedI8nTextRule,
        value: { Форматированный: "Истина", Текст: { en: "Field" } },
        source: { items: { ru: "Поле" } },
      })

      expect(result).toEqual({
        formatted: true,
        items: { ru: "Поле", en: "Field" },
      })
    })
  })
})
