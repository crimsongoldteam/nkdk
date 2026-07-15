import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromYAML } from "../../../../tests/property/importPropertyFromYAML"
import { exportToYAML } from "../../../../yaml/export"
import { importFromYAML } from "../../../../yaml/import"
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

describe("import SettingsParameterValueCollection from YAML", { timeout: 60_000 }, () => {
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

  it("imports nested ent system enumeration values", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ВидДвижения: {
          Использовать: "Ложь",
          Значение: {
            Тип: "СистемноеПеречисление",
            Имя: "AccumulationRecordType",
            Значение: "Приход",
          },
        },
      },
    })

    expect(result).toEqual({
      itemType: "SettingsParameterValueCollection",
      parameters: {
        ВидДвижения: {
          parameter: "ВидДвижения",
          use: false,
          value: {
            type: "SystemEnumeration",
            typeSE: "AccumulationRecordType",
            value: "Receipt",
          },
        },
      },
    })
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

  it("preserves double-quoted numeric-looking full parameter value as string", () => {
    const yaml = parseViaYamlText({
      Маска: {
        Значение: "123",
      },
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
