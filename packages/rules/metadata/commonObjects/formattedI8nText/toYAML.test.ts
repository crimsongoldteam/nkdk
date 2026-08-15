import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "./__fixtures__/data"
import { mockContextToYAML, mockRule } from "../../../tests/mockContext"
import { exportFormattedI8nTextDefaultToYAML, exportFormattedI8nTextToYAML } from "./toYAML"
import { FormattedI8nTextPropertyRule } from "./types"
import {
  markYAMLMappingTag,
  markYAMLScalarTag,
  serializeYAMLDocument,
  xmlAnomalyTagValue,
} from "@nkdk/runtime"

const formattedI8nTextRule: FormattedI8nTextPropertyRule = {
  type: "FormattedI8nText",
  yaml: "Title",
}

describe("exportFormattedI8nTextToYAML", () => {
  formattedI8nTextFixtures.forEach((fixture) => {
    it(`should export: ${fixture.name}`, () => {
      const result = exportFormattedI8nTextToYAML({
        context: mockContextToYAML,
        rule: formattedI8nTextRule,
        value: fixture.text,
      })

      const expected = fixture.valueYAML ? { Title: fixture.valueYAML } : {}
      expect(result).toEqual(expected)
    })
  })

  it("exports explicit empty text for excludeIfEqualNameYAML", () => {
    const result = exportFormattedI8nTextToYAML({
      context: mockContextToYAML,
      rule: {
        type: "FormattedI8nText",
        yaml: "Заголовок",
        excludeIfEqualNameYAML: true,
      },
      name: "ФормаЭлемента",
      value: {
        formatted: false,
        items: {},
      },
    })

    expect(result).toEqual({
      Заголовок: {
        Текст: "",
      },
    })
  })

  it("keeps non-default languages when default language equals the name", () => {
    const result = exportFormattedI8nTextToYAML({
      context: mockContextToYAML,
      rule: {
        type: "FormattedI8nText",
        yaml: "Title",
        excludeIfEqualNameYAML: true,
      } as FormattedI8nTextPropertyRule,
      name: "КакоеТоПоле",
      value: {
        formatted: true,
        items: { ru: "Какое то поле", en: "Some field" },
      },
    })

    expect(result).toEqual({
      Title: {
        Форматированный: "Истина",
        Текст: { en: "Some field" },
      },
    })
  })

  it("serializes language anomalies inside Text", () => {
    const items = { en: "Group", ru: xmlAnomalyTagValue("xml/duplicate", "Группа") }
    markYAMLMappingTag(items, "xml/order")
    markYAMLScalarTag(items, "ru", "xml/duplicate")

    const result = exportFormattedI8nTextToYAML({
      context: mockContextToYAML,
      rule: { type: "FormattedI8nText", yaml: "Заголовок", excludeIfEqualNameYAML: true },
      name: "Группа",
      value: { formatted: false, items },
    })

    expect(serializeYAMLDocument(result).text).toBe(
      "Заголовок:\n  Текст: !xml/order\n    en: Group\n    ru: !xml/duplicate Группа",
    )
  })

  describe("exportFormattedI8nTextDefaultToYAML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export default: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextDefaultToYAML(mockContextToYAML, mockRule, fixture.text)

        expect(result).toEqual(fixture.defaultLanguageYAML)
      })
    })
  })
})
