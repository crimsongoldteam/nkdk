import { describe, expect, it } from "vitest"
import type { ValidateFunction } from "ajv"
import { Type, type TSchema } from "typebox"
import {
  compileValidationSchema,
  createValidationSchemaFromAjvFunction,
} from "./compileValidationSchema"

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
        params: { missingProperty: "Имя" },
      }),
    ])

    const [, additionalErrors] = compiled.Errors({ Имя: "Документ", Лишнее: true })
    expect(additionalErrors).toEqual([
      expect.objectContaining({
        keyword: "additionalProperties",
        instancePath: "",
        params: { additionalProperty: "Лишнее" },
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

  it("compiles root schema against external nkdk refs", () => {
    const child = Type.Object({ Имя: Type.String() }, { $id: "nkdk://schema/TestChild" })
    const root = Type.Object({
      Ребёнок: { $ref: "nkdk://schema/TestChild" } as TSchema,
    })

    const compiled = compileValidationSchema(
      { "nkdk://schema/TestChild": child },
      root,
      { inlineRefs: false }
    )

    expect(compiled.Check({ Ребёнок: { Имя: "Тест" } })).toBe(true)
    expect(compiled.Check({ Ребёнок: { Имя: 10 } })).toBe(false)
  })

  it("keeps TypeBox undefined semantics for parsed empty YAML values", () => {
    const compiled = compileValidationSchema(Type.Union([Type.Undefined(), Type.Null()]))

    expect(compiled.Check(undefined)).toBe(true)
    expect(compiled.Check(null)).toBe(true)
    expect(compiled.Check("")).toBe(false)
  })

  it("can compile TypeBox fallback eagerly for schemas with local defs", () => {
    const schema = Type.Object({
      Значения: Type.Cyclic(
        {
          Local: Type.Record(Type.String(), Type.Object({ Значение: Type.String() })),
        },
        "Local"
      ),
    })

    const compiled = compileValidationSchema(schema, { eagerFallback: true })

    expect(compiled.Check({ Значения: { Тест: { Значение: "ok" } } })).toBe(true)
  })

  it("оборачивает готовую AJV-функцию в совместимый интерфейс валидатора", () => {
    const schema = Type.Object({ Имя: Type.String() }, { additionalProperties: false })
    const validate = Object.assign(
      (value: unknown) => {
        const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
        if (typeof record.Имя === "string" && Object.keys(record).every((key) => key === "Имя")) {
          validate.errors = null
          return true
        }

        validate.errors = [
          {
            keyword: "required",
            instancePath: "",
            schemaPath: "#/required",
            params: { missingProperty: "Имя" },
            message: "must have required property 'Имя'",
          },
          {
            keyword: "additionalProperties",
            instancePath: "",
            schemaPath: "#/additionalProperties",
            params: { additionalProperty: "Лишнее" },
            message: "must NOT have additional properties",
          },
        ]
        return false
      },
      { errors: null as ValidateFunction["errors"] }
    ) as ValidateFunction

    const compiled = createValidationSchemaFromAjvFunction({ schema, context: {}, validate })

    expect(compiled.Check({ Имя: "Документ" })).toBe(true)
    expect(compiled.Check({ Лишнее: true })).toBe(false)
    expect(compiled.Schema()).toBe(schema)
    expect(compiled.Context()).toEqual({})

    const [, errors] = compiled.Errors({ Лишнее: true })
    expect(errors).toEqual([
      expect.objectContaining({
        keyword: "required",
        instancePath: "",
        params: { missingProperty: "Имя" },
      }),
      expect.objectContaining({
        keyword: "additionalProperties",
        instancePath: "",
        params: { additionalProperty: "Лишнее" },
      }),
    ])
  })
})
