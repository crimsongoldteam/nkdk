import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import { describe, expect, it } from "vitest"
import { ChoiceListJSONSchema } from "./types"

describe("ChoiceListJSONSchema", () => {
  const compiled = compileValidationSchema(ChoiceListJSONSchema)

  it("accepts form choice list objects with presentation or compact value", () => {
    expect(
      compiled.Check([
        {
          Представление: "Физическое лицо",
          Значение: '"ФЛ"',
        },
        {
          Значение: "Истина",
        },
      ])
    ).toBe(true)
  })

  it("rejects empty and unknown form choice list objects", () => {
    expect(compiled.Check([{}])).toBe(false)
    expect(compiled.Check([{ Лишнее: "x" }])).toBe(false)
  })
})
