import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseI8nText } from "./parse"
import { I8nText } from "./types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseI8nText", () => {
  it("should parse undefined as undefined", () => {
    const result = parseI8nText(undefined, configurationSettings)

    expect(result).toBeUndefined()
  })

  it("should parse string value", () => {
    const result = parseI8nText("Поле", configurationSettings)

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
      configurationSettings
    )

    expect(result).toEqual(expectedResult)
  })

  it("should parse object value with single language", () => {
    const result = parseI8nText({ en: "Field" }, configurationSettings)

    expect(result).toEqual({
      items: {
        en: "Field",
      },
    })
  })

  it("should parse empty object", () => {
    const result = parseI8nText({}, configurationSettings)

    expect(result).toEqual({
      items: {},
    })
  })
})
