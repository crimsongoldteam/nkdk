import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
}

describe("import Appearance from YAML", () => {
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
})
