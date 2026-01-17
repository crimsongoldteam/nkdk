import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { isEmptyI8nText } from "./helper"
import { I8nText } from "./types"

describe("isEmptyI8nText", () => {
  it("should return true for empty items object", () => {
    const data: I8nText = { items: {} }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(true)
  })

  it("should return true for default language with empty string", () => {
    const data: I8nText = { items: { ru: "" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(true)
  })

  it("should return false for default language with non-empty content", () => {
    const data: I8nText = { items: { ru: "Текст" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return false for non-default language only", () => {
    const data: I8nText = { items: { en: "Text" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return false for non-default language with empty string", () => {
    const data: I8nText = { items: { en: "" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return false for default language (empty) and non-default language", () => {
    const data: I8nText = { items: { ru: "", en: "Text" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return false for default language (non-empty) and non-default language", () => {
    const data: I8nText = { items: { ru: "Текст", en: "Text" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return false for multiple non-default languages", () => {
    const data: I8nText = { items: { en: "Text", de: "TextDE" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return false for default language (non-empty) with formatted property", () => {
    const data: I8nText = { formatted: true, items: { ru: "Текст" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(false)
  })

  it("should return true for default language (empty) with formatted property", () => {
    const data: I8nText = { formatted: true, items: { ru: "" } }

    const result = isEmptyI8nText(mockСontext, data)

    expect(result).toBe(true)
  })
})
