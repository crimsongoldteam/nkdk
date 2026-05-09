import { describe, expect, it } from "vitest"
import { exportPropertyToXML, type PropertyRule } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { calculatedFields } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "CalculatedFields",
  xml: "CalculatedField",
}

describe("export CalculatedFields to XML", () => {
  it("exports multiple CalculatedField nodes", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: calculatedFields,
    })

    expect(result).toEqual([
      {
        "dcssch:dataPath": "РабочееМесто",
        "dcssch:expression": "ФискальноеУстройство.РабочееМесто",
        "dcssch:title": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": [
            {
              "v8:lang": "ru",
              "v8:content": "Рабочее место",
            },
          ],
        },
      },
      {
        "dcssch:dataPath": "ОбщееСостояниеПодключения",
        "dcssch:expression": "",
        "dcssch:title": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": [
            {
              "v8:lang": "ru",
              "v8:content": "Настройки",
            },
          ],
        },
      },
    ])
  })
})
