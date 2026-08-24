import { describe, expect, it } from "vitest"
import { Type, type TSchema } from "typebox"
import { Locale } from "typebox/system"
import { compileTypeboxValidationSchema } from "./typeboxValidationCompiler"

function discriminated(propertyName: string, branches: [TSchema, TSchema, ...TSchema[]]): TSchema {
  return { oneOf: branches, discriminator: { propertyName } } as TSchema
}

const direct = discriminated("Kind", [
  Type.Object({ Kind: Type.Literal("A"), text: Type.String() }),
  Type.Object({ Kind: Type.Literal("B"), count: Type.Number() }),
])

describe("compileTypeboxValidationSchema", () => {
  it("выбирает ветвь discriminator и возвращает только её первую ошибку с полным путём", () => {
    const validator = compileTypeboxValidationSchema({}, Type.Object({ Child: direct }))

    expect(validator.Check({ Child: { Kind: "B", count: 1 } })).toBe(true)
    expect(validator.Errors({ Child: { Kind: "B", count: "bad" } })).toEqual([
      false,
      [expect.objectContaining({
        keyword: "type",
        instancePath: "/Child/count",
        params: { type: "number" },
      })],
    ])
  })

  it.each([
    ["неизвестную строку", { Child: { Kind: "X" } }, "enum", { allowedValues: ["A", "B"] }],
    ["отсутствующее значение", { Child: {} }, "type", { type: "string" }],
    ["нестроковое значение", { Child: { Kind: 1 } }, "type", { type: "string" }],
  ])("указывает %s discriminator на его поле", (_case, value, keyword, params) => {
    const validator = compileTypeboxValidationSchema({}, Type.Object({ Child: direct }))

    expect(validator.Errors(value)).toEqual([
      false,
      [expect.objectContaining({ keyword, instancePath: "/Child/Kind", params })],
    ])
  })

  it("разрешает значение discriminator через внешний ref и allOf", () => {
    const context = {
      BaseA: Type.Object({ Kind: Type.Literal("A") }, { $id: "BaseA" }),
      BaseB: Type.Object({ Kind: Type.Literal("B") }, { $id: "BaseB" }),
    }
    const schema = discriminated("Kind", [
      Type.Intersect([Type.Ref("BaseA"), Type.Object({ text: Type.String() })]),
      Type.Intersect([Type.Ref("BaseB"), Type.Object({ count: Type.Number() })]),
    ])
    const validator = compileTypeboxValidationSchema(context, schema)

    expect(validator.Check({ Kind: "A", text: "ok" })).toBe(true)
    expect(validator.Errors({ Kind: "B", count: "bad" })[1]).toEqual([
      expect.objectContaining({ keyword: "type", instancePath: "/count" }),
    ])
  })

  it("обрабатывает discriminator внутри рекурсивной Type.Cyclic схемы", () => {
    const definitions = {
      Items: Type.Record(
        Type.String(),
        discriminated("Kind", [
          Type.Object({ Kind: Type.Literal("Group"), children: Type.Optional(Type.Ref("Items")) }),
          Type.Object({ Kind: Type.Literal("Text"), text: Type.String() }),
        ]),
      ),
    }
    const context = { Items: Type.Cyclic(definitions, "Items") }
    const validator = compileTypeboxValidationSchema(context, Type.Object({ items: Type.Ref("Items") }))

    expect(validator.Errors({
      items: { root: { Kind: "Group", children: { label: { Kind: "Text", text: 1 } } } },
    })[1]).toEqual([
      expect.objectContaining({
        keyword: "type",
        instancePath: "/items/root/children/label/text",
      }),
    ])
  })

  it("сохраняет вложенную ошибку discriminator внутри record-схемы", () => {
    const validator = compileTypeboxValidationSchema({}, Type.Object({
      items: { type: "object", additionalProperties: direct } as TSchema,
    }))

    expect(validator.Errors({ items: { child: { Kind: "B", count: "bad" } } })[1]).toEqual([
      expect.objectContaining({
        keyword: "type",
        instancePath: "/items/child/count",
      }),
    ])
  })

  it("разделяет одноимённые локальные Type.Cyclic определения", () => {
    const stringValue = Type.Cyclic({
      Value: Type.Union([Type.String(), Type.Object({ next: Type.Ref("Value") })]),
    }, "Value")
    const numberValue = Type.Cyclic({
      Value: Type.Union([Type.Number(), Type.Object({ next: Type.Ref("Value") })]),
    }, "Value")
    const validator = compileTypeboxValidationSchema({}, Type.Union([stringValue, numberValue]))

    expect(validator.Check("text")).toBe(true)
    expect(validator.Check(42)).toBe(true)
  })

  it("возвращает одну ошибку границы для union без discriminator", () => {
    const validator = compileTypeboxValidationSchema({}, Type.Union([Type.String(), Type.Number()]))

    expect(validator.Errors(false)[1]).toEqual([
      expect.objectContaining({ keyword: "anyOf", instancePath: "" }),
    ])
  })

  it.each([
    ["без const", [Type.Object({ Kind: Type.String() }), Type.Object({ Kind: Type.Literal("B") })]],
    ["с повторяющимся const", [
      Type.Object({ Kind: Type.Literal("A") }),
      Type.Object({ Kind: Type.Literal("A") }),
    ]],
  ])("отклоняет discriminator %s при компиляции", (_case, branches) => {
    expect(() => compileTypeboxValidationSchema({}, discriminated("Kind", [branches[0]!, branches[1]!])) )
      .toThrow(/discriminator/i)
  })

  it("восстанавливает Locale после валидного и ошибочного результата", () => {
    const originalLocale = Locale.Get()
    const customLocale = () => "custom"
    Locale.Set(customLocale)
    try {
      const validator = compileTypeboxValidationSchema({}, Type.Object({ Child: direct }))

      expect(validator.Errors({ Child: { Kind: "A", text: "ok" } })).toEqual([true, []])
      expect(Locale.Get()).toBe(customLocale)
      expect(validator.Errors({ Child: { Kind: "B", count: "bad" } })[1][0]?.message).toBe("custom")
      expect(Locale.Get()).toBe(customLocale)
    } finally {
      Locale.Set(originalLocale)
    }
  })
})
