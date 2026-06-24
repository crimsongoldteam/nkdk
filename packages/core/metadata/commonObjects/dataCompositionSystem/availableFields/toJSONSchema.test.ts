import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import "./toJSONSchema"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("AvailableFields JSON Schema", () => {
  it("accepts strings and object items", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "AvailableFields", yaml: "ДоступныеПоляОтбора" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check(["Документ", { Поле: "Документ", Использование: "Ложь" }])).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "AvailableFields", yaml: "ДоступныеПоляОтбора" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ Документ: { Поле: "Документ" } })).toBe(false)
  })
})
