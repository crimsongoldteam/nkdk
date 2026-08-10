import { describe, expect, it } from "vitest"
import { Type, type TSchema } from "typebox"
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
    const [, errors] = compiled.Errors({ Лишнее: true })
    expect(Object.keys(errors[0] ?? {}).sort()).toEqual([
      "instancePath",
      "keyword",
      "message",
      "params",
      "schemaPath",
    ])
    expect(errors).toEqual([
      expect.objectContaining({
        keyword: "required",
        instancePath: "",
        params: { requiredProperties: ["Имя"] },
      }),
    ])

    const [, additionalErrors] = compiled.Errors({ Имя: "Документ", Лишнее: true })
    expect(additionalErrors).toEqual([
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
  })

  it("compiles root schema against external nkdk refs", () => {
    const child = Type.Object({ Имя: Type.String() }, { $id: "nkdk://schema/TestChild" })
    const root = Type.Object({
      Ребёнок: { $ref: "nkdk://schema/TestChild" } as TSchema,
    })

    const compiled = compileValidationSchema({ "nkdk://schema/TestChild": child }, root)

    expect(compiled.Check({ Ребёнок: { Имя: "Тест" } })).toBe(true)
    expect(compiled.Check({ Ребёнок: { Имя: 10 } })).toBe(false)
  })

  it("keeps TypeBox undefined semantics for parsed empty YAML values", () => {
    const compiled = compileValidationSchema(Type.Union([Type.Undefined(), Type.Null()]))

    expect(compiled.Check(undefined)).toBe(true)
    expect(compiled.Check(null)).toBe(true)
    expect(compiled.Check("")).toBe(false)
  })

  it("компилирует Type.Cyclic с локальными определениями", () => {
    const schema = Type.Object({
      Значения: Type.Cyclic(
        {
          Local: Type.Record(Type.String(), Type.Object({ Значение: Type.String() })),
        },
        "Local"
      ),
    })

    const compiled = compileValidationSchema(schema)

    expect(compiled.Check({ Значения: { Тест: { Значение: "ok" } } })).toBe(true)
  })
})
