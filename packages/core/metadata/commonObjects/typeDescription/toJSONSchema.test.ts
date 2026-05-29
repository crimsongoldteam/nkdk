import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportTypeDescriptionToJSONSchema } from "./toJSONSchema"

const unrestrictedRule = { type: "TypeDescription" } as const

const restrictedRule = {
  type: "TypeDescription",
  allowedTypes: [
    "string",
    "decimal",
    "date",
    "boolean",
    "ValueStorage",
    "UUID",
    "CatalogRef",
    "CatalogRef.*",
    "DefinedType.*",
  ],
} as const

describe("exportTypeDescriptionToJSONSchema", () => {
  it("keeps broad schema when allowedTypes is absent", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: unrestrictedRule,
      value: undefined,
    })

    expect(schema).toMatchObject({
      anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
        { type: "object" },
      ],
    })
  })

  it("exports strict primitive descriptions and examples", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    })

    const text = JSON.stringify(schema)
    expect(text).toContain("Число(длина, точность)")
    expect(text).toContain("ФиксированнаяСтрока(10)")
    expect(text).toContain("ПоложительноеЧисло(10, 2)")
  })

  it("exports x-nkdk-graph query for concrete catalog references", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    }) as {
      anyOf: Array<{ anyOf?: Array<Record<string, unknown>> }>
    }

    const single = schema.anyOf[0]!.anyOf!
    const catalogRef = single.find((item) => item.pattern === "^Справочник\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$")

    expect(catalogRef).toMatchObject({
      "x-nkdk-graph": {
        query: "MATCH (n:MetadataObject {kind: 'MetadataCatalog'}) RETURN n.name ORDER BY n.name",
      },
    })
  })

  it("rejects single-only types inside composite arrays", () => {
    const schema = TypeCompiler.Compile(
      exportTypeDescriptionToJSONSchema({
        context: mockContext,
        rule: restrictedRule,
        value: undefined,
      })
    )

    expect(schema.Check(["Строка", "Справочник.Контрагенты"])).toBe(true)
    expect(schema.Check(["Строка", "ХранилищеЗначения"])).toBe(false)
    expect(schema.Check(["Строка", "ОпределяемыйТип.ДенежнаяСумма"])).toBe(false)
  })

  it("rejects type id object when allowedTypes is set", () => {
    const schema = TypeCompiler.Compile(
      exportTypeDescriptionToJSONSchema({
        context: mockContext,
        rule: restrictedRule,
        value: undefined,
      })
    )

    expect(schema.Check({ ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] })).toBe(false)
  })
})
