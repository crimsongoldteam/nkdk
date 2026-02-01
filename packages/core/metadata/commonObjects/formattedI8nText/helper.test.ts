import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { isEmptyFormattedI8nText } from "./helper"
import { FormattedI8nText } from "./types"

describe("isEmptyFormattedI8nText", () => {
  it("should return false when formatted is true", () => {
    const data: FormattedI8nText = { formatted: true, items: {} }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })

  it("should return false when formatted is true and items is empty", () => {
    const data: FormattedI8nText = { formatted: true, items: {} }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })

  it("should return false when formatted is true with default language empty", () => {
    const data: FormattedI8nText = { formatted: true, items: { ru: "" } }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })

  it("should return false when formatted is true with content", () => {
    const data: FormattedI8nText = { formatted: true, items: { ru: "Текст" } }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })

  it("should return true for empty items when formatted is false", () => {
    const data: FormattedI8nText = { formatted: false, items: {} }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(true)
  })

  it("should return true for default language with empty string when formatted is false", () => {
    const data: FormattedI8nText = { formatted: false, items: { ru: "" } }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(true)
  })

  it("should return false for default language with non-empty content when formatted is false", () => {
    const data: FormattedI8nText = { formatted: false, items: { ru: "Текст" } }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })

  it("should return false for non-default language only when formatted is false", () => {
    const data: FormattedI8nText = { formatted: false, items: { en: "Text" } }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })

  it("should return false for non-default language with empty string when formatted is false", () => {
    const data: FormattedI8nText = { formatted: false, items: { en: "" } }

    const result = isEmptyFormattedI8nText(mockContext, data)

    expect(result).toBe(false)
  })
})
