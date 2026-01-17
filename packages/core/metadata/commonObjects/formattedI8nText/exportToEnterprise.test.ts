import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockСontext } from "~/tests/mockContext"
import {
  exportFormattedI8nTextDefaultToEnterprise,
  exportFormattedI8nTextToEnterprise,
  exportI8nTextDefaultToEnterprise,
  exportI8nTextOtherToEnterprise,
} from "./exportToEnterprise"
import { FormattedI8nText, I8nText } from "./types"

describe("exportFormattedI8nTextToEnterprise", () => {
  it("should format empty text as undefined", () => {
    const result = exportFormattedI8nTextToEnterprise(mockСontext, undefined, "Заголовок", "ФорматированныйЗаголовок")

    expect(result).toBeUndefined()
  })

  it("should format default language text", () => {
    const mockI8nText: FormattedI8nText = { formatted: false, items: { ru: "Поле" } }
    const expectedResult = "Поле"

    const result = exportFormattedI8nTextToEnterprise(mockСontext, mockI8nText, "Заголовок", "ФорматированныйЗаголовок")

    expect(result).toEqual(expectedResult)
  })

  it("should format non-default language text", () => {
    const mockI8nText: FormattedI8nText = { formatted: false, items: { en: "Поле" } }
    const expectedResult = { en: "Поле" }

    const result = exportFormattedI8nTextToEnterprise(mockСontext, mockI8nText, "Заголовок", "ФорматированныйЗаголовок")

    expect(result).toEqual(expectedResult)
  })

  it("should format multilanguage text", () => {
    const mockI8nText: FormattedI8nText = { formatted: false, items: { ru: "Поле", en: "Field" } }
    const expectedResult = { ru: "Поле", en: "Field" }

    const result = exportFormattedI8nTextToEnterprise(mockСontext, mockI8nText, "Заголовок", "ФорматированныйЗаголовок")

    expect(result).toEqual(expectedResult)
  })
})

describe("exportFormattedI8nTextDefaultToEnterprise", () => {
  i8nTextFixtures.forEach((fixture) => {
    if (fixture.fullI8nText !== undefined) {
      it(`should export default language: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextDefaultToEnterprise(mockСontext, fixture.fullFormattedI8nText)

        expect(result).toEqual(fixture.expectedDefaultExport)
      })
    }
  })

  it("should return undefined for undefined input", () => {
    const result = exportFormattedI8nTextDefaultToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when default language is missing", () => {
    const mockI8nText: I8nText = { items: { en: "Field" } }
    const result = exportI8nTextDefaultToEnterprise(mockСontext, mockI8nText)

    expect(result).toBeUndefined()
  })
})

describe("exportI8nTextDefaultToEnterprise", () => {
  it.each(i8nTextFixtures)("should export  $name", (fixture) => {
    const defaultExport = exportI8nTextDefaultToEnterprise(mockСontext, fixture.fullI8nText)
    const otherExport = exportI8nTextOtherToEnterprise(mockСontext, fixture.fullI8nText)
    expect(defaultExport).toEqual(fixture.expectedDefaultExport)
    expect(otherExport).toEqual(fixture.expectedOtherExport)
  })
})
