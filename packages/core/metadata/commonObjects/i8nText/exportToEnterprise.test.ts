import { describe, expect, it } from "vitest"
import { combinedI8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportI8nTextDefaultToEnterprise,
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "./exportToEnterprise"
import { I8nText } from "./types"

describe("exportI8nTextToEnterprise", () => {
  it("should format empty text as undefined", () => {
    const result = exportI8nTextToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should format default language text", () => {
    const mockI8nText: I8nText = { items: { ru: "Поле" } }
    const expectedResult = "Поле"

    const result = exportI8nTextToEnterprise(mockСontext, mockI8nText)

    expect(result).toEqual(expectedResult)
  })

  it("should format non-default language text", () => {
    const mockI8nText: I8nText = { items: { en: "Поле" } }
    const expectedResult = { en: "Поле" }

    const result = exportI8nTextToEnterprise(mockСontext, mockI8nText)

    expect(result).toEqual(expectedResult)
  })

  it("should format multilanguage text", () => {
    const mockI8nText: I8nText = { items: { ru: "Поле", en: "Field" } }
    const expectedResult = { ru: "Поле", en: "Field" }

    const result = exportI8nTextToEnterprise(mockСontext, mockI8nText)

    expect(result).toEqual(expectedResult)
  })
})

describe("exportI8nTextDefaultToEnterprise", () => {
  combinedI8nTextFixtures.forEach((fixture) => {
    if (fixture.fullI8nText !== undefined) {
      it(`should export default language: ${fixture.name}`, () => {
        const result = exportI8nTextDefaultToEnterprise(mockСontext, fixture.fullI8nText)

        expect(result).toEqual(fixture.expectedDefaultExport)
      })
    }
  })

  it("should return undefined for undefined input", () => {
    const result = exportI8nTextDefaultToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when default language is missing", () => {
    const mockI8nText: I8nText = { items: { en: "Field" } }
    const result = exportI8nTextDefaultToEnterprise(mockСontext, mockI8nText)

    expect(result).toBeUndefined()
  })
})

describe("exportI8nTextDefaultToEnterprise", () => {
  it.each(combinedI8nTextFixtures)("should export  $name", (fixture) => {
    const defaultExport = exportI8nTextDefaultToEnterprise(mockСontext, fixture.fullI8nText)
    const otherExport = exportI8nTextOtherToEnterprise(mockСontext, fixture.fullI8nText)
    expect(defaultExport).toEqual(fixture.expectedDefaultExport)
    expect(otherExport).toEqual(fixture.expectedOtherExport)
  })
})
