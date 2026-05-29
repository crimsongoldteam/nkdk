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

type SchemaBranch = Record<string, unknown>

const findSchemaBranchByPattern = (schema: unknown, pattern: string): SchemaBranch | undefined => {
  if (!schema || typeof schema !== "object") {
    return undefined
  }

  const branch = schema as SchemaBranch
  if (branch.pattern === pattern) {
    return branch
  }

  for (const value of Object.values(branch)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findSchemaBranchByPattern(item, pattern)
        if (found) {
          return found
        }
      }
      continue
    }

    const found = findSchemaBranchByPattern(value, pattern)
    if (found) {
      return found
    }
  }

  return undefined
}

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
    })

    const catalogRef = findSchemaBranchByPattern(
      schema,
      "^Справочник\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$"
    )

    expect(catalogRef).toMatchObject({
      "x-nkdk-graph": {
        query: "MATCH (n:MetadataObject {kind: 'MetadataCatalog'}) RETURN n.name ORDER BY n.name",
      },
    })
  })

  it("rejects single-only types inside composite arrays", () => {
    const jsonSchema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    })
    if (jsonSchema === undefined) {
      throw new Error("Expected TypeDescription JSON schema")
    }
    const schema = TypeCompiler.Compile(jsonSchema)

    expect(schema.Check(["Строка", "Справочник.Контрагенты"])).toBe(true)
    expect(schema.Check(["Строка", "ХранилищеЗначения"])).toBe(false)
    expect(schema.Check(["Строка", "ОпределяемыйТип.ДенежнаяСумма"])).toBe(false)
  })

  it("rejects type id object when allowedTypes is set", () => {
    const jsonSchema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    })
    if (jsonSchema === undefined) {
      throw new Error("Expected TypeDescription JSON schema")
    }
    const schema = TypeCompiler.Compile(jsonSchema)

    expect(schema.Check({ ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] })).toBe(false)
  })
})
