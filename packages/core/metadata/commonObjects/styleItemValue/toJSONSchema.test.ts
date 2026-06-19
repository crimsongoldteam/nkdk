import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { getTypeRule, type PropertyRule } from "~/metadata/orchestration"
import { registerCoreMetadata } from "~/metadata/register"
import { mockContext } from "~/tests/mockContext"

registerCoreMetadata()

const rule = { type: "StyleItemValue" } as Extract<PropertyRule, { type: "StyleItemValue" }>

describe("StyleItemValue exportToJSONSchema", () => {
  const compileStyleItemValueSchema = () => {
    const exportToJSONSchema = getTypeRule("StyleItemValue", "exportToJSONSchema")
    expect(exportToJSONSchema).toBeDefined()
    if (exportToJSONSchema === undefined) throw new Error("StyleItemValue JSON schema export is not registered")

    const schema = exportToJSONSchema({ context: mockContext, rule, value: undefined })
    expect(schema).toBeDefined()
    if (schema === undefined) throw new Error("StyleItemValue JSON schema is not registered")

    return TypeCompiler.Compile(schema)
  }

  it("accepts supported style item value kinds", () => {
    const compiled = compileStyleItemValueSchema()

    expect(compiled.Check({ Вид: "Шрифт", Значение: { Вид: "ОбычныйШрифтТекста", Размер: 12 } })).toBe(true)
    expect(compiled.Check({ Вид: "Цвет", Значение: "#FFE100" })).toBe(true)
    expect(compiled.Check({ Вид: "Рамка", Значение: { Ширина: 1, ТипРамки: "БезРамки" } })).toBe(true)
  })

  it("rejects unknown kind and extra variant properties", () => {
    const compiled = compileStyleItemValueSchema()

    expect(compiled.Check({ Вид: "Тень", Значение: "#FFE100" })).toBe(false)
    expect(compiled.Check({ Вид: "Цвет", Значение: "#FFE100", Лишнее: "значение" })).toBe(false)
  })
})
