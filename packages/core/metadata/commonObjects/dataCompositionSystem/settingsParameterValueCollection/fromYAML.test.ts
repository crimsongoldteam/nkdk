import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
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
  const parseViaYamlText = <T>(value: T): T => importFromYAML<T>(exportToYAML(value))

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

  it("imports full SettingsParameterValue entries while keeping outer parameter name", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Параметр1: {
          Значение: "ПараметрыДанных.Параметр1",
        },
      },
    })

    expect(result).toEqual({
      itemType: "SettingsParameterValueCollection",
      parameters: {
        Параметр1: {
          parameter: "Параметр1",
          value: "ПараметрыДанных.Параметр1",
        },
      },
    })
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

  it("uses explicit parameter rules before default item rule in JSON Schema", () => {
    const schema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: {
        type: "SettingsParameterValueCollection",
        defaultItemRule: {
          type: "SettingsParameterValue",
          valueType: "Primitive",
        },
        parameterRules: {
          СвязиПараметровВыбора: {
            type: "SettingsParameterValue",
            valueType: "ChoiceParameterLinks",
          },
          ПараметрыВыбора: {
            type: "SettingsParameterValue",
            valueType: "Parameter",
          },
        },
      },
      value: undefined,
    })
    if (schema === undefined) throw new Error("SettingsParameterValueCollection JSON Schema is not registered")
    const compiled = TypeCompiler.Compile(schema)

    expect(
      compiled.Check({
        СвязиПараметровВыбора: [
          {
            Имя: "ПараметрВыбора",
            ПутьКДанным: "Поле1",
            РежимИзменения: "НеИзменять",
          },
        ],
        ПараметрыВыбора: { Параметр: 123 },
        ФорматРедактирования: "ЧЦ=15; ЧДЦ=2",
      })
    ).toBe(true)
  })

  it("preserves double-quoted numeric-looking parameter value as string", () => {
    const yaml = parseViaYamlText({
      Маска: "123",
    })

    const result = testImportPropertyFromYAML({
      rule: {
        type: "SettingsParameterValueCollection",
        defaultItemRule: {
          type: "SettingsParameterValue",
          valueType: "Primitive",
        },
      } as PropertyRule,
      value: yaml,
    })

    expect(result).toEqual({
      itemType: "SettingsParameterValueCollection",
      parameters: {
        Маска: {
          parameter: "Маска",
          value: { type: "string", value: "123" },
        },
      },
    })
  })
})
