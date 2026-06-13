import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/metadata/commonObjects/formattedI8nText/__fixtures__/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportFormattedI8nTextDefaultToYAML, exportFormattedI8nTextToYAML } from "./toYAML"
import { FormattedI8nTextPropertyRule } from "./types"

const formattedI8nTextRule: FormattedI8nTextPropertyRule = {
  type: "FormattedI8nText",
  yaml: "Title",
  yamlFormatted: "FormattedTitle",
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

  describe("exportFormattedI8nTextDefaultToYAML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export default: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextDefaultToYAML(mockContextToYAML, mockRule, fixture.text)

        expect(result).toEqual(fixture.defaultLanguageYAML)
      })
    })
  })

})
