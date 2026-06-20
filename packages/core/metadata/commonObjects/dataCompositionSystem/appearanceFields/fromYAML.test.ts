import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
}

describe("import Appearance from YAML", () => {
  const parseViaYamlText = <T>(value: T): T => importFromYAML<T>(exportToYAML(value))

  it("should import YAML to metadata", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fixtureAppearanceFieldsYAML,
    })

    expect(result).toEqual(fixtureAppearanceFields)
  })

  it("imports explicit field value for text appearance", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Текст: {
          Тип: "Поле",
          Значение: "СписокФайлов.ФормаРСВ_Представление",
        },
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: {
          type: "Field",
          value: "СписокФайлов.ФормаРСВ_Представление",
        },
      },
    })
  })

  it("imports double-quoted numeric-looking text appearance as string value", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: parseViaYamlText({
        Текст: "6678",
      }),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        value: {
          type: "string",
          value: "6678",
        },
      },
    })
  })

  it("imports double-quoted absolute color as color value", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: importFromYAML<{ ЦветФона: string }>('ЦветФона: "#000000"'),
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветФона: {
        parameter: "ЦветФона",
        value: {
          type: "Absolute",
          value: "#000000",
        },
      },
    })
  })

  it("preserves source empty LocalStringType for text appearance when YAML omits value", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Текст: {
          Использовать: "Ложь",
        },
      },
      sourceValue: {
        itemType: "AppearanceFields",
        Текст: {
          parameter: "Текст",
          use: false,
          value: { items: {} },
        },
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      Текст: {
        parameter: "Текст",
        use: false,
        value: { items: {} },
      },
    })
  })

  it("imports empty color parameter as enabled DCS auto color", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ЦветТекста: null,
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
      },
    })
  })

  it("keeps non-color empty SettingsParameterValue unchanged", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Текст: null,
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
    })
  })
})
