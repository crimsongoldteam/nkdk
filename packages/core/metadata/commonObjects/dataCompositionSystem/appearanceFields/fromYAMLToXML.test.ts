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
