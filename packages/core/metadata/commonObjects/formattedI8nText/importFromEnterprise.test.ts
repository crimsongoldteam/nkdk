import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockСontext } from "~/tests/mockContext"
import {
  importFormattedI8nTextCombinedFromEnterprise,
  importFormattedI8nTextFromEnterprise,
} from "./importFromEnterprise"

describe("importFormattedI8nTextFromEnterprise", () => {
  describe("importFormattedI8nTextFromEnterprise", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextFromEnterprise(
        mockСontext,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })

  describe("importFormattedI8nTextCombinedFromEnterprise", () => {
    it.each(formattedI8nTextFixtures)("should import: %s", (fixture) => {
      const result = importFormattedI8nTextCombinedFromEnterprise(
        mockСontext,
        fixture.text,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })
})
