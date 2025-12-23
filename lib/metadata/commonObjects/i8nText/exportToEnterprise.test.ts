import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { exportI8nTextToEnterprise } from "./exportToEnterprise"
import { I8nText } from "./types"

describe("exportI8nTextToEnterprise", () => {
  it("should format empty text as undefined", () => {
    const result = exportI8nTextToEnterprise(mockConfigurationSettings, undefined)

    expect(result).toBeUndefined()
  })

  it("should format default language text", () => {
    const mockI8nText: I8nText = { items: { ru: "Поле" } }
    const expectedResult = "Поле"

    const result = exportI8nTextToEnterprise(mockConfigurationSettings, mockI8nText)

    expect(result).toEqual(expectedResult)
  })

  it("should format non-default language text", () => {
    const mockI8nText: I8nText = { items: { en: "Поле" } }
    const expectedResult = { en: "Поле" }

    const result = exportI8nTextToEnterprise(mockConfigurationSettings, mockI8nText)

    expect(result).toEqual(expectedResult)
  })

  it("should format multilanguage text", () => {
    const mockI8nText: I8nText = { items: { ru: "Поле", en: "Field" } }
    const expectedResult = { ru: "Поле", en: "Field" }

    const result = exportI8nTextToEnterprise(mockConfigurationSettings, mockI8nText)

    expect(result).toEqual(expectedResult)
  })
})
