import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/tests/fixtures/formattedI8nText/data"
import { mockСontext } from "~/tests/mockContext"
import { importFormattedI8nTextFromEnterprise } from "./importFromEnterprise"

describe("importFormattedI8nTextFromEnterprise", () => {
  formattedI8nTextFixtures.forEach((fixture) => {
    it(`should import: ${fixture.name}`, () => {
      const result = importFormattedI8nTextFromEnterprise(
        mockСontext,
        fixture.enterpriseText,
        fixture.enterpriseFormattedText
      )
      expect(result).toEqual(fixture.text)
    })
  })
})
