import { describe,expect,it } from "vitest"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import { PropertyRule } from "../../../ruleRuntime"
import {
settingsParameterValueCollectionFixture,
settingsParameterValueCollectionFixtureYAML,
} from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  yaml: "ПараметрыДанных",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}

const accumulationRecordTypeCollection = {
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
} as const

describe("export SettingsParameterValueCollection to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports fixture", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: settingsParameterValueCollectionFixture,
    })

    expect(result).toEqual({ ПараметрыДанных: settingsParameterValueCollectionFixtureYAML })
  })

  it("keeps ent system enumeration values nested under Значение", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: accumulationRecordTypeCollection,
    })

    expect(result).toEqual({
      ПараметрыДанных: {
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
  })

  it("exports xsi:nil parameter value as explicit YAML null", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "SettingsParameterValueCollection",
        parameters: {
          Параметр1: {
            parameter: "Параметр1",
            xmlNil: true,
            userSettingID: "21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a",
          },
        },
      },
    })

    expect(result).toEqual({
      ПараметрыДанных: {
        Параметр1: {
          Значение: null,
          ИдентификаторПользовательскойНастройки: "21b52fc2-2b83-40f1-aa31-8dce4c9e7e9a",
        },
      },
    })
  })
})
