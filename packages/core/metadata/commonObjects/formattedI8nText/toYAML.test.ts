import { describe, expect, it } from "vitest"
import { FormattedI8nTextPropertyRule } from "~/metadata/metadataFactory"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContext, mockContextToYAML, mockRule } from "~/tests/mockContext"
import {
  exportFormattedI8nTextDefaultToYAML,
  exportFormattedI8nTextOtherToYAML,
  exportFormattedI8nTextToYAML,
} from "./toYAML"

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

  describe("exportFormattedI8nTextOtherToYAML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export other: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextOtherToYAML(
          mockContextToYAML,
          mockRule,
          fixture.text,
          "Title",
          "FormattedTitle"
        )

        if (!fixture.text) {
          expect(result).toEqual({})
          return
        }

        const defaultLanguage = mockContext.defaultLanguage
        const otherItems = Object.fromEntries(
          Object.entries(fixture.text.items).filter(([lang]) => lang !== defaultLanguage)
        )

        if (Object.keys(otherItems).length === 0) {
          expect(result).toEqual({})
        } else if (fixture.text.formatted) {
          expect(result).toEqual({ FormattedTitle: fixture.otherLanguagesFormattedTextYAML })
        } else {
          expect(result).toEqual({ Title: fixture.otherLanguagesTextYAML })
        }
      })
    })
  })
})
