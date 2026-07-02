import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/metadata/commonObjects/formattedI8nText/__fixtures__/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportFormattedI8nTextDefaultToYAML, exportFormattedI8nTextToYAML } from "./toYAML"
import { FormattedI8nTextPropertyRule } from "./types"

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

  describe("exportFormattedI8nTextDefaultToYAML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export default: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextDefaultToYAML(mockContextToYAML, mockRule, fixture.text)

        expect(result).toEqual(fixture.defaultLanguageYAML)
      })
    })
  })

})
