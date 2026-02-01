import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockContext } from "~/tests/mockContext"
import {
  importFormattedI8nTextCombinedFromEnterprise,
  importFormattedI8nTextFromEnterprise,
} from "./importFromEnterprise"

describe("importFormattedI8nTextFromEnterprise", () => {
  describe("importFormattedI8nTextFromEnterprise", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromEnterprise(
        mockContext,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importFormattedI8nTextCombinedFromEnterprise", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextCombinedFromEnterprise(
        mockContext,
        fixture.textFromStructure,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })
})
