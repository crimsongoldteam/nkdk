import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { importPropertyFromYAML } from "~/metadata/orchestration"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import { importFromYAML } from "~/yaml/import"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"

const rule = { type: "DcsAvailableValues" } as const

describe("import DcsAvailableValues from YAML", () => {
  it("imports string values", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: stringAvailableValuesYAML,
    })

    expect(result).toEqual(stringAvailableValues)
  })

  it("imports double-quoted numeric string value from parsed YAML as string", () => {
    const yaml = importFromYAML([
      '- Значение: "2"',
      "  Представление: 2 знака",
    ].join("\n"))

    const result = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: yaml,
    })

    expect(result).toEqual([
      {
        itemType: "DcsAvailableValue",
        value: { type: "string", value: "2" },
        presentation: { items: { ru: "2 знака" } },
      },
    ])
  })

  it("imports absent value as undefined", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule,
      value: nilAndBooleanAvailableValuesYAML,
    })

    expect(result).toEqual(nilAndBooleanAvailableValues)
  })

  it("accepts string values in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("DcsAvailableValues JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check([{ Значение: '"Выставлен"', Представление: { ru: "Выставлен" } }])).toBe(true)
  })

  it("accepts absent values in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("DcsAvailableValues JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check([{}])).toBe(true)
  })

  it("rejects unsupported available value keys in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("DcsAvailableValues JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check([{ Значение: '"Выставлен"', НеизвестноеПоле: "x" }])).toBe(false)
  })
})
