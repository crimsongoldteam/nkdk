import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import {
  importFormattedI8nTextCombinedFromYAML,
  importFormattedI8nTextFromYAML,
} from "./importFromYAML"

describe("importFormattedI8nTextFromYAML", () => {
  describe("importFormattedI8nTextFromYAML", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromYAML(
        mockContext,
        mockRule,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importFormattedI8nTextCombinedFromYAML", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextCombinedFromYAML(
        mockContext,
        mockRule,
        fixture.textFromStructure,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })
})
