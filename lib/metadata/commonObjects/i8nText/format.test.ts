import { describe, expect, it } from "vitest"
import { formatI8nText } from "./format"
import { TI8nText } from "./types"

describe("formatI8nText", () => {
  it("should format empty text as undefined", () => {
    const result = formatI8nText(undefined, "ru")

    expect(result).toBeUndefined()
  })

  it("should format default language text", () => {
    const mockI8nText: TI8nText = { items: { ru: "Поле" } }
    const expectedResult = "Поле"

    const result = formatI8nText(mockI8nText, "ru")

    expect(result).toEqual(expectedResult)
  })

  it("should format non-default language text", () => {
    const mockI8nText: TI8nText = { items: { en: "Поле" } }
    const expectedResult = { en: "Поле" }

    const result = formatI8nText(mockI8nText, "ru")

    expect(result).toEqual(expectedResult)
  })

  it("should format multilanguage text", () => {
    const mockI8nText: TI8nText = { items: { ru: "Поле", en: "Field" } }
    const expectedResult = { ru: "Поле", en: "Field" }

    const result = formatI8nText(mockI8nText, "ru")

    expect(result).toEqual(expectedResult)
  })
})
