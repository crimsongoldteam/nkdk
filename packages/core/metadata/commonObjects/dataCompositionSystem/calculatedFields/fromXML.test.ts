import { describe, expect, it } from "vitest"
import { importPropertyFromXML, type PropertyRule } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { calculatedFields } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "CalculatedFields",
  xml: "CalculatedField",
}

describe("import CalculatedFields from XML", () => {
  it("imports a single CalculatedField as an array", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: {
        "dcssch:dataPath": "РабочееМесто",
        "dcssch:expression": "ФискальноеУстройство.РабочееМесто",
        "dcssch:title": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": {
            "v8:lang": "ru",
            "v8:content": "Рабочее место",
          },
        },
      },
    })

    expect(result).toEqual([calculatedFields[0]])
  })

  it("imports multiple CalculatedField nodes as an array", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: [
        {
          "dcssch:dataPath": "РабочееМесто",
          "dcssch:expression": "ФискальноеУстройство.РабочееМесто",
          "dcssch:title": {
            "_xsi:type": "v8:LocalStringType",
            "v8:item": {
              "v8:lang": "ru",
              "v8:content": "Рабочее место",
            },
          },
        },
        {
          "dcssch:dataPath": "ОбщееСостояниеПодключения",
          "dcssch:expression": "",
          "dcssch:title": {
            "_xsi:type": "v8:LocalStringType",
            "v8:item": {
              "v8:lang": "ru",
              "v8:content": "Настройки",
            },
          },
        },
      ],
    })

    expect(result).toEqual(calculatedFields)
  })
})
