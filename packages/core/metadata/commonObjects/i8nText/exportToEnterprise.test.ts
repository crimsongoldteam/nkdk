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
    i8nTextFixtures.forEach((fixture) => {
      it(`should export: ${fixture.name}`, () => {
        const result = exportI8nTextToEnterprise(mockСontext, fixture.text)
        expect(result).toEqual(fixture.enterpriseFull)
      })
    })
  })

  describe("exportI8nTextDefaultToEnterprise", () => {
    i8nTextFixtures.forEach((fixture) => {
      it(`should export default: ${fixture.name}`, () => {
        const result = exportI8nTextDefaultToEnterprise(mockСontext, fixture.text)
        expect(result).toEqual(fixture.enterpriseDefaultLanguage)
      })
    })
  })

  describe("exportI8nTextOtherToEnterprise", () => {
    i8nTextFixtures.forEach((fixture) => {
      it(`should export other: ${fixture.name}`, () => {
        const result = exportI8nTextOtherToEnterprise(mockСontext, fixture.text)
        expect(result).toEqual(fixture.enterpriseOtherLanguages)
      })
    })
  })
})
