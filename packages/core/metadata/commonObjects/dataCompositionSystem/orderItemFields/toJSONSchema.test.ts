import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../../orchestration/property/toJSONSchema"
import "./types"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("OrderItemFields JSON Schema", () => {
  it("accepts order field items and auto marker", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "OrderItemFields", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check([{ Поле: "Дата" }, "[Авто]"])).toBe(true)
  })

  it("rejects record-shaped values", () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "OrderItemFields", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check({ Дата: { Поле: "Дата" } })).toBe(false)
  })
})
