import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportI8nTextDefaultToEnterprise,
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "./exportToEnterprise"

describe("exportI8nTextToEnterprise", () => {
  describe("exportI8nTextToEnterprise", () => {
    it.each(i8nTextFixtures)("should export: $name", (fixture) => {
      const result = exportI8nTextToEnterprise(mockСontext, fixture.text)
      expect(result).toEqual(fixture.enterpriseFull)
    })
  })

  describe("exportI8nTextDefaultToEnterprise", () => {
    it.each(i8nTextFixtures)("should export default: $name", (fixture) => {
      const result = exportI8nTextDefaultToEnterprise(mockСontext, fixture.text)
      expect(result).toEqual(fixture.enterpriseDefaultLanguage)
    })
  })

  describe("exportI8nTextOtherToEnterprise", () => {
    it.each(i8nTextFixtures)("should export other: $name", (fixture) => {
      const result = exportI8nTextOtherToEnterprise(mockСontext, fixture.text)
      expect(result).toEqual(fixture.enterpriseOtherLanguages)
    })
  })
})
