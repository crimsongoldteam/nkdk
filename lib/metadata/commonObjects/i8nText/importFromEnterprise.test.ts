import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { parseI8nText } from "./importFromEnterprise"
import { I8nText } from "./types"

describe("parseI8nText", () => {
  it("should parse undefined as undefined", () => {
    const result = parseI8nText(undefined, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })

  it("should parse string value", () => {
    const result = parseI8nText("Поле", mockConfigurationSettings)

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

    const result = parseI8nText(
      { ru: "Поле", en: "Field" },
      mockConfigurationSettings
    )

    expect(result).toEqual(expectedResult)
  })

  it("should parse object value with single language", () => {
    const result = parseI8nText({ en: "Field" }, mockConfigurationSettings)

    expect(result).toEqual({
      items: {
        en: "Field",
      },
    })
  })

  it("should parse empty object", () => {
    const result = parseI8nText({}, mockConfigurationSettings)

    expect(result).toEqual({
      items: {},
    })
  })
})

