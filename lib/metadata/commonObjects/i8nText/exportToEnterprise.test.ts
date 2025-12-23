import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { exportI8nTextToEnterprise } from "./exportToEnterprise"
import { I8nText } from "./types"

describe("exportI8nTextToEnterprise", () => {
  it("should format empty text as undefined", () => {
    const result = exportI8nTextToEnterprise(mockcontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should format default language text", () => {
    const mockI8nText: I8nText = { items: { ru: "Поле" } }
    const expectedResult = "Поле"

    const result = exportI8nTextToEnterprise(mockcontext, mockI8nText)

    expect(result).toEqual(expectedResult)
  })

  it("should format non-default language text", () => {
    const mockI8nText: I8nText = { items: { en: "Поле" } }
    const expectedResult = { en: "Поле" }

    const result = exportI8nTextToEnterprise(mockcontext, mockI8nText)

    expect(result).toEqual(expectedResult)
  })

  it("should format multilanguage text", () => {
    const mockI8nText: I8nText = { items: { ru: "Поле", en: "Field" } }
    const expectedResult = { ru: "Поле", en: "Field" }

    const result = exportI8nTextToEnterprise(mockcontext, mockI8nText)

    expect(result).toEqual(expectedResult)
  })
})
