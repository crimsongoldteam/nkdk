import { describe, expect, it } from "vitest"
import { Type } from "typebox"
import { compileValidationSchema } from "./compileValidationSchema"

describe("compileValidationSchema", () => {
  it("компилирует TypeBox-схему через совместимый интерфейс валидатора", () => {
    const schema = Type.Object(
      {
        Имя: Type.String(),
      },
      { additionalProperties: false }
    )

    const compiled = compileValidationSchema(schema)

    expect(compiled.Check({ Имя: "Документ" })).toBe(true)
    expect(compiled.Check({ Лишнее: true })).toBe(false)
    expect(compiled.Schema()).toBe(schema)

    const [, errors] = compiled.Errors({ Лишнее: true })
    expect(errors).toEqual([
      expect.objectContaining({
        keyword: "required",
        instancePath: "",
        params: { requiredProperties: ["Имя"] },
      }),
      expect.objectContaining({
        keyword: "additionalProperties",
        instancePath: "",
        params: { additionalProperties: ["Лишнее"] },
      }),
    ])
  })

  it("компилирует схему с контекстом ссылок", () => {
    const context = {
      Named: Type.Object({ Значение: Type.String() }, { $id: "Named" }),
    }
    const compiled = compileValidationSchema(context, Type.Ref("Named"))

    expect(compiled.Check({ Значение: "ok" })).toBe(true)
    expect(compiled.Check({ Значение: 1 })).toBe(false)
    expect(compiled.Context()).toBe(context)
  })
})
