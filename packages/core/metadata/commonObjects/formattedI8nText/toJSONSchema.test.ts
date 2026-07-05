import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { FormattedI8nTextJSONSchema } from "./types"

describe("FormattedI8nTextJSONSchema", () => {
  const compiled = compileValidationSchema(FormattedI8nTextJSONSchema)

  it("accepts plain default-language text", () => {
    expect(compiled.Check({ Текст: "Заголовок" })).toBe(true)
  })

  it("accepts plain multilingual text", () => {
    expect(compiled.Check({ Текст: { ru: "Заголовок", en: "Title" } })).toBe(true)
  })

  it("accepts formatted text with explicit Истина marker", () => {
    expect(compiled.Check({ Форматированный: "Истина", Текст: "<b>Заголовок</>" })).toBe(true)
  })

  it("rejects explicit formatted false marker", () => {
    expect(compiled.Check({ Форматированный: "Ложь", Текст: "Заголовок" })).toBe(false)
  })

  it("rejects empty object without text", () => {
    expect(compiled.Check({})).toBe(false)
  })

  it("rejects additional properties", () => {
    expect(compiled.Check({ Текст: "Заголовок", Лишнее: "значение" })).toBe(false)
  })
})
