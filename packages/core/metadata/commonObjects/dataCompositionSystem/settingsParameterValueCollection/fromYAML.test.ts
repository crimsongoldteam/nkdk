import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import {
  settingsParameterValueCollectionFixture,
  settingsParameterValueCollectionFixtureYAML,
} from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}

describe("import SettingsParameterValueCollection from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports fixture", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: settingsParameterValueCollectionFixtureYAML,
    })

    expect(result).toEqual(settingsParameterValueCollectionFixture)
  })

  it("accepts arbitrary parameter names with default item rule in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("SettingsParameterValueCollection JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check({ ДанныеПолучены: { Использовать: "Ложь" } })).toBe(true)
  })

  it("accepts parameter value wrappers in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("SettingsParameterValueCollection JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check({ Год: { Использовать: "Ложь", Значение: 0 } })).toBe(true)
  })

  it("rejects unsupported parameter value keys in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({ context: mockContext, rule, value: undefined })
    if (schema === undefined) throw new Error("SettingsParameterValueCollection JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check({ Год: { Использовать: "Ложь", НеизвестноеПоле: 0 } })).toBe(false)
  })
})
