import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { testPropertyFromXMLToYAML } from "../../../../tests/directConversion"
import type { MetadataItemRule } from "../../../ruleRuntime/property/types"
import { fixtureAppearanceFields, fixtureAppearanceFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AppearanceFields",
  yaml: "Оформление",
}

const directRule = {
  itemType: "AppearanceFieldsProbe",
  properties: {
    appearance: { type: "AppearanceFields", yaml: "Оформление", xml: "appearance" },
  },
} as MetadataItemRule

const exportText = (valueXML: unknown): unknown =>
  testPropertyFromXMLToYAML({
    rule: directRule,
    xml: {
      appearance: {
        "dcscor:item": {
          "_xsi:type": "dcsset:SettingsParameterValue",
          "dcscor:parameter": "Текст",
          ...(valueXML === undefined ? {} : { "dcscor:value": valueXML }),
        },
      },
    },
  }).yaml

describe("AppearanceFields XML → YAML", () => {
  it.each([
    ["xs:string", { "_xsi:type": "xs:string", "#text": "Строка" }, "Строка"],
    ["empty xs:string", { "_xsi:type": "xs:string", "#text": "" }, ""],
    [
      "LocalStringType",
      { "_xsi:type": "v8:LocalStringType", "v8:item": { "v8:lang": "ru", "v8:content": "Строка" } },
      { Значение: { ru: "Строка" } },
    ],
    ["empty LocalStringType", { "_xsi:type": "v8:LocalStringType" }, { Значение: {} }],
    [
      "Field",
      { "_xsi:type": "dcscor:Field", "#text": "Таблица.Поле" },
      { Тип: "Поле", Значение: "Таблица.Поле" },
    ],
    [
      "LocalFormattedStringType",
      {
        "_xsi:type": "v8:LocalFormattedStringType",
        "v8:lws": { "v8:item": { "v8:lang": "ru", "v8:content": "Строка" } },
        "v8:formatted": true,
      },
      { Тип: "ФорматированнаяСтрока", Значение: { ru: "Строка" } },
    ],
    [
      "empty LocalFormattedStringType",
      { "_xsi:type": "v8:LocalFormattedStringType", "v8:formatted": true },
      { Тип: "ФорматированнаяСтрока", Значение: {} },
    ],
    ["xsi:nil", { "_xsi:nil": true }, { Значение: null }],
    ["missing dcscor:value", undefined, {}],
  ])("exports %s canonically", (_name, valueXML, expectedYAML) => {
    expect(exportText(valueXML)).toEqual({ Оформление: { Текст: expectedYAML } })
  })

  it.each([
    [{ "_xsi:type": "xs:string", "#text": "Строка" }, { Значение: "Строка", Использовать: "Ложь" }],
    [
      { "_xsi:type": "v8:LocalStringType", "v8:item": { "v8:lang": "ru", "v8:content": "Строка" } },
      { Значение: { ru: "Строка" }, Использовать: "Ложь" },
    ],
    [
      { "_xsi:type": "dcscor:Field", "#text": "Таблица.Поле" },
      { Тип: "Поле", Значение: "Таблица.Поле", Использовать: "Ложь" },
    ],
  ])("preserves service fields for string form %#", (valueXML, expectedYAML) => {
    const result = testPropertyFromXMLToYAML({
      rule: directRule,
      xml: {
        appearance: {
          "dcscor:item": {
            "_xsi:type": "dcsset:SettingsParameterValue",
            "dcscor:parameter": "Текст",
            "dcscor:use": false,
            "dcscor:value": valueXML,
          },
        },
      },
    }).yaml

    expect(result).toEqual({ Оформление: { Текст: expectedYAML } })
  })

  it("should export minimal appearance", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: fixtureAppearanceFields,
      yaml: fixtureAppearanceFieldsYAML,
    })

    expect(result).toEqual({
      Оформление: fixtureAppearanceFieldsYAML,
    })
  })

  it("exports explicit LocalFormattedStringType value for text appearance", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        Текст: {
          parameter: "Текст",
          value: {
            type: "LocalFormattedStringType",
            value: {
              formatted: true,
              items: { ru: "Многоязычная форматированная строка" },
            },
          },
        },
      },
      yaml: {
        Текст: {
          Тип: "ФорматированнаяСтрока",
          Значение: { ru: "Многоязычная форматированная строка" },
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        Текст: {
          Тип: "ФорматированнаяСтрока",
          Значение: { ru: "Многоязычная форматированная строка" },
        },
      },
    })
  })

  it("exports enabled DCS auto color as explicit YAML marker", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
        },
      },
      yaml: { ЦветТекста: "Авто" },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: "Авто",
      },
    })
  })

  it("exports disabled DCS auto color with explicit YAML marker", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветФона: {
          parameter: "ЦветФона",
          use: false,
        },
      },
      yaml: { ЦветФона: { Использовать: "Ложь", Значение: "Авто" } },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветФона: {
          Использовать: "Ложь",
          Значение: "Авто",
        },
      },
    })
  })

  it("exports non-auto color in full SettingsParameterValue form", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
          value: {
            type: "Absolute",
            value: "#FF0000",
          },
        },
      },
      yaml: { ЦветТекста: { Значение: "#FF0000" } },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: {
          Значение: "#FF0000",
        },
      },
    })
  })
})
