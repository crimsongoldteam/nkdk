import { describe, expect, it } from "vitest"
import { testPropertyFromYAMLToXML } from "../../../../tests/directConversion"
import "./rules"

const rule = {
  itemType: "Probe",
  properties: {
    appearance: {
      type: "AppearanceFields",
      yaml: "Оформление",
      xml: "appearance",
    },
  },
} as const

describe("AppearanceFields YAML → XML", () => {
  it.each([
    ["empty xs:string", "", { "_xsi:type": "xs:string", "#text": "" }],
    ["empty LocalStringType", {}, { "_xsi:type": "v8:LocalStringType" }],
    [
      "empty ru item",
      { ru: "" },
      {
        "_xsi:type": "v8:LocalStringType",
        "v8:item": [{ "v8:lang": "ru", "v8:content": "" }],
      },
    ],
    [
      "empty LocalFormattedStringType",
      { Форматированный: "Истина", Текст: {} },
      {
        "_xsi:type": "v8:LocalFormattedStringType",
        "v8:lws": { "v8:item": [] },
        "v8:formatted": true,
      },
    ],
    ["xsi:nil", null, { "_xsi:nil": true }],
  ])("exports %s", (_name, value, expectedValueXML) => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Оформление: { Текст: value } },
    })

    expect(result.xml).toEqual({
      appearance: {
        "dcscor:item": [
          {
            "dcscor:parameter": "Текст",
            "dcscor:value": expectedValueXML,
            "_xsi:type": "dcsset:SettingsParameterValue",
          },
        ],
      },
    })
  })

  it("exports an expanded disabled string with a required value", () => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: {
        Оформление: {
          Формат: { Использовать: "Ложь", Значение: { ru: "Строка" } },
        },
      },
    })

    expect(result.xml).toMatchObject({
      appearance: {
        "dcscor:item": [
          {
            "dcscor:use": false,
            "dcscor:parameter": "Формат",
            "dcscor:value": { "_xsi:type": "v8:LocalStringType" },
          },
        ],
      },
    })
  })

  it("exports explicit DCS auto color marker", () => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: {
        Оформление: {
          ЦветТекста: "Авто",
        },
      },
    })

    expect(result.xml).toEqual({
      appearance: {
        "dcscor:item": [
          {
            "dcscor:parameter": "ЦветТекста",
            "dcscor:value": {
              "_xsi:type": "v8ui:Color",
              "#text": "auto",
            },
            "_xsi:type": "dcsset:SettingsParameterValue",
          },
        ],
      },
    })
  })
})
