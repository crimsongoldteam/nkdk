import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportFormattedI8nTextDefaultToEnterprise,
  exportFormattedI8nTextOtherToEnterprise,
  exportFormattedI8nTextToEnterprise,
} from "./exportToEnterprise"

describe("exportFormattedI8nTextToEnterprise", () => {
  describe("exportFormattedI8nTextToEnterprise", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextToEnterprise(mockСontext, fixture.text, "Title", "FormattedTitle")

        if (fixture.text?.formatted) {
          expect(result).toEqual({ FormattedTitle: fixture.enterpriseFormattedText })
        } else {
          const expected = fixture.enterpriseText ? { Title: fixture.enterpriseText } : {}
          expect(result).toEqual(expected)
        }
      })
    })
  })

  describe("exportFormattedI8nTextDefaultToEnterprise", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export default: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextDefaultToEnterprise(mockСontext, fixture.text)

        // This function calls exportI8nTextToEnterprise which returns the i8n text content
        // regardless of formatted flag, so it should match enterpriseText
        expect(result).toEqual(fixture.enterpriseText)
      })
    })
  })

  describe("exportFormattedI8nTextOtherToEnterprise", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`should export other: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextOtherToEnterprise(mockСontext, fixture.text, "Title", "FormattedTitle")

        // Extract other languages (excluding default language 'ru')
        if (!fixture.text) {
          expect(result).toEqual({})
          return
        }

        const defaultLanguage = mockСontext.defaultLanguage
        const otherItems = Object.fromEntries(
          Object.entries(fixture.text.items).filter(([lang]) => lang !== defaultLanguage)
        )

        if (Object.keys(otherItems).length === 0) {
          expect(result).toEqual({})
        } else if (fixture.text.formatted) {
          expect(result).toEqual({ FormattedTitle: { ...otherItems } })
        } else {
          expect(result).toEqual({ Title: { ...otherItems } })
        }
      })
    })
  })
})
