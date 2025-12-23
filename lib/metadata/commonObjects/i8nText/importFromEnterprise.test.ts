import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { parseI8nText } from "./importFromEnterprise"
import { I8nText } from "./types"

describe("parseI8nText", () => {
  it("should parse undefined as undefined", () => {
    const result = parseI8nText(undefined, mockcontext)

    expect(result).toBeUndefined()
  })

  it("should parse string value", () => {
    const result = parseI8nText("Поле", mockcontext)

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

    const result = parseI8nText({ ru: "Поле", en: "Field" }, mockcontext)

    expect(result).toEqual(expectedResult)
  })

  it("should parse object value with single language", () => {
    const result = parseI8nText({ en: "Field" }, mockcontext)

    expect(result).toEqual({
      items: {
        en: "Field",
      },
    })
  })

  it("should parse empty object", () => {
    const result = parseI8nText({}, mockcontext)

    expect(result).toEqual({
      items: {},
    })
  })
})
