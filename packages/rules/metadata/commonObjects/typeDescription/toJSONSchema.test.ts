import { describe,expect,it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "./../../validation/compileValidationSchema"
import {
buildMultiStateTypeDescriptionJSONSchema,
exportTypeDescriptionToJSONSchema,
} from "./toJSONSchema"

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

const externalRefsRule = {
  type: "TypeDescription",
  allowedTypes: ["ExternalDataSourceTableRef.*", "ExternalDataSourceCubeDimensionTableRef.*"],
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

    if (schema === undefined) {
      throw new Error("Expected TypeDescription JSON schema")
    }
    const compiled = compileValidationSchema(schema)
    expect(compiled.Check("Строка")).toBe(true)
    expect(compiled.Check([])).toBe(true)
    expect(compiled.Check(["Строка", "Число"])).toBe(true)
    expect(compiled.Check({ ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] })).toBe(false)
    expect(compiled.Check({})).toBe(false)
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

  it("exports concrete catalog reference pattern without graph hints", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    })

    const catalogRef = findSchemaBranchByPattern(schema, "^Справочник\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$")

    expect(catalogRef).toMatchObject({
      type: "string",
      pattern: "^Справочник\\.[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
    })
    expect(JSON.stringify(catalogRef)).not.toContain("x-nkdk-graph")
  })

  it("exports external data source reference patterns without graph hints", () => {
    const schema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: externalRefsRule,
      value: undefined,
    })

    const externalTableRef = findSchemaBranchByPattern(
      schema,
      "^ВнешнийИсточникДанных[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*\\.Таблица[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$"
    )
    const externalCubeDimensionTableRef = findSchemaBranchByPattern(
      schema,
      "^ВнешнийИсточникДанных[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*\\.Куб[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*\\.ТаблицаИзмерения[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$"
    )

    expect(externalTableRef).toMatchObject({
      type: "string",
      pattern:
        "^ВнешнийИсточникДанных[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*\\.Таблица[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
    })
    expect(externalCubeDimensionTableRef).toMatchObject({
      type: "string",
      pattern:
        "^ВнешнийИсточникДанных[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*\\.Куб[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*\\.ТаблицаИзмерения[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*$",
    })
    expect(JSON.stringify(schema)).not.toContain("x-nkdk-graph")
  })

  it("validates external data source references with compiled TypeBox schema", () => {
    const jsonSchema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: externalRefsRule,
      value: undefined,
    })
    if (jsonSchema === undefined) {
      throw new Error("Expected TypeDescription JSON schema")
    }
    const schema = compileValidationSchema(jsonSchema)

    expect(schema.Check("ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства")).toBe(true)
    expect(schema.Check("ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства.ТаблицаИзмеренияВсеСвойства")).toBe(true)
    expect(schema.Check(["ВнешнийИсточникДанныхВсеСвойства.ТаблицаВсеСвойства"])).toBe(false)
    expect(schema.Check("ВнешнийИсточникДанныхВсеСвойства.КубВсеСвойства")).toBe(false)
  })

  it("omits composite array branch when all allowed types are single-only", () => {
    const jsonSchema = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: externalRefsRule,
      value: undefined,
    })

    expect(JSON.stringify(jsonSchema)).not.toContain('"type":"array"')
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
    const schema = compileValidationSchema(jsonSchema)

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
    const schema = compileValidationSchema(jsonSchema)

    expect(schema.Check({ ИдентификаторТипа: ["8c1e3694-da12-44d5-8b1f-d134b89a1282"] })).toBe(false)
  })

  it("builds MultiState array schema with an empty controlled part", () => {
    const base = exportTypeDescriptionToJSONSchema({
      context: mockContext,
      rule: restrictedRule,
      value: undefined,
    })
    if (base === undefined) throw new Error("Expected TypeDescription JSON schema")
    const schema = compileValidationSchema(buildMultiStateTypeDescriptionJSONSchema(base))

    expect(schema.Check(["Справочник.Контрагенты", "Дата"])).toBe(true)
    expect(schema.Check([[], "Справочник.Контрагенты"])).toBe(true)
    expect(schema.Check([])).toBe(false)
    expect(schema.Check([["Строка"], "Дата"])).toBe(false)
    expect(schema.Check("Дата")).toBe(false)
  })
})
