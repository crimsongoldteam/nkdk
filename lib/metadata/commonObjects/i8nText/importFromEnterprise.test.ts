import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { parseI8nText } from "./importFromEnterprise"
import { I8nText } from "./types"

describe("parseI8nText", () => {
  it("should parse undefined as undefined", () => {
    const result = parseI8nText(undefined, mockСontext)

    expect(result).toBeUndefined()
  })

  it("should parse string value", () => {
    const result = parseI8nText("Поле", mockСontext)

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

    const result = parseI8nText({ ru: "Поле", en: "Field" }, mockСontext)

    expect(result).toEqual(expectedResult)
  })

  it("should parse object value with single language", () => {
    const result = parseI8nText({ en: "Field" }, mockСontext)

    expect(result).toEqual({
      items: {
        en: "Field",
      },
    })
  })

  it("should parse empty object", () => {
    const result = parseI8nText({}, mockСontext)

    expect(result).toEqual({
      items: {},
    })
  })
})
