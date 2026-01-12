import { describe, expect, it } from "vitest"
import { combinedI8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockСontext } from "~/tests/mockContext"
import { importI8nTextCombinedFromEnterprise, importI8nTextFromEnterprise } from "./importFromEnterprise"
import { I8nText } from "./types"

describe("importI8nTextFromEnterprise", () => {
  it("should parse undefined as undefined", () => {
    const result = importI8nTextFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should parse string value", () => {
    const result = importI8nTextFromEnterprise(mockСontext, "Поле")

    expect(result).toEqual({
      items: {
        ru: "Поле",
      },
    })
  })

  it("should parse object value", () => {
    const expectedResult: I8nText = {
      items: {
        ru: "Поле",
        en: "Field",
      },
    }

    const result = importI8nTextFromEnterprise(mockСontext, { ru: "Поле", en: "Field" })

    expect(result).toEqual(expectedResult)
  })

  it("should parse object value with single language", () => {
    const result = importI8nTextFromEnterprise(mockСontext, { en: "Field" })

    expect(result).toEqual({
      items: {
        en: "Field",
      },
    })
  })

  it("should parse empty object", () => {
    const result = importI8nTextFromEnterprise(mockСontext, {})

    expect(result).toEqual({
      items: {},
    })
  })
})

describe("importI8nTextCombinedFromEnterprise", () => {
  combinedI8nTextFixtures.forEach((fixture) => {
    it(`should import combined I8nText: ${fixture.name}`, () => {
      const result = importI8nTextCombinedFromEnterprise(
        mockСontext,
        fixture.defaultLanguage,
        fixture.otherLanguagesEnterprise
      )

      expect(result).toEqual(fixture.expectedResult)
    })
  })
})
