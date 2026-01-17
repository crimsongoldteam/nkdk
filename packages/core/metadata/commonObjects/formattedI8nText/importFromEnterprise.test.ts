import { describe, expect, it } from "vitest"
import { i8nTextFixtures } from "~/tests/fixtures/i8nText/data"
import { mockСontext } from "~/tests/mockContext"
import { importI8nTextCombinedFromEnterprise, importI8nTextFromEnterprise } from "../i8nText/importFromEnterprise"
import { I8nText } from "../i8nText/types"

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
  i8nTextFixtures.forEach((fixture) => {
    it(`should import combined I8nText: ${fixture.name}`, () => {
      const result = importI8nTextCombinedFromEnterprise(
        mockСontext,
        fixture.textFromStructure,
        fixture.enterpriseOtherLanguages
      )

      const expectedResult: I8nText | undefined =
        fixture.text ||
        (fixture.textFromStructure === undefined && fixture.enterpriseOtherLanguages === undefined
          ? undefined
          : {
              items: {
                ...(fixture.textFromStructure?.items || {}),
                ...(typeof fixture.enterpriseOtherLanguages === "object" && fixture.enterpriseOtherLanguages !== null
                  ? fixture.enterpriseOtherLanguages
                  : typeof fixture.enterpriseOtherLanguages === "string"
                    ? { [mockСontext.defaultLanguage]: fixture.enterpriseOtherLanguages }
                    : {}),
              },
            })

      expect(result).toEqual(expectedResult)
    })
  })
})
