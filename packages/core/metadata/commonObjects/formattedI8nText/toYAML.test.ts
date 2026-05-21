import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportFormattedI8nTextDefaultToYAML, exportFormattedI8nTextToYAML } from "./toYAML"
import { FormattedI8nTextPropertyRule } from "./types"

describe("exportFormattedI8nTextToYAML", () => {
  describe("exportFormattedI8nTextToYAML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextToYAML({
          context: mockContextToYAML,
          rule: {
            type: "FormattedI8nText",
            yaml: "Title",
            yamlFormatted: "FormattedTitle",
          } as unknown as FormattedI8nTextPropertyRule,
          value: fixture.text,
        })

        if (fixture.text?.formatted) {
          expect(result).toEqual({ FormattedTitle: fixture.formattedTextYAML })
        } else {
          const expected = fixture.textYAML ? { Title: fixture.textYAML } : {}
          expect(result).toEqual(expected)
        }
      })
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
