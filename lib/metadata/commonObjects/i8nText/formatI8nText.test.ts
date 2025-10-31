import { expect, it } from "vitest"
import { formatI8nText } from "./formatI8nText"
import { TI8nText } from "./types"

it("should format empty text as undefined", () => {
  const result = formatI8nText(undefined, "ru")

  expect(result).toBeUndefined()
})

it("should format default language text", () => {
  const mockI8nText: TI8nText = { ru: "Поле" }
  const expectedResult = "Поле"

  const result = formatI8nText(mockI8nText, "ru")

  expect(result).toEqual(expectedResult)
})

it("should format non-default language text", () => {
  const mockI8nText: TI8nText = { en: "Поле" }
  const expectedResult = { en: "Поле" }

  const result = formatI8nText(mockI8nText, "ru")

  expect(result).toEqual(expectedResult)
})

it("should format multilanguage text", () => {
  const mockI8nText: TI8nText = { ru: "Поле", en: "Field" }
  const expectedResult = { ru: "Поле", en: "Field" }

  const result = formatI8nText(mockI8nText, "ru")

  expect(result).toEqual(expectedResult)
})
