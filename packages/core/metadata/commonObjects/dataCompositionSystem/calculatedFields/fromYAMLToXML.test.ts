import { describe, expect, it } from "vitest"
import { type PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "CalculatedFields",
  xml: "CalculatedField",
}

describe("export CalculatedFields to XML", () => {
  it("exports multiple CalculatedField nodes", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: calculatedFields,
      yaml: calculatedFieldsYAML,
      xmlRootTag: "CalculatedField",
    })

    expect(result).toContain("<dcssch:dataPath>РабочееМесто</dcssch:dataPath>")
    expect(result).toContain("<dcssch:expression>ФискальноеУстройство.РабочееМесто</dcssch:expression>")
    expect(result).toContain("<v8:content>Рабочее место</v8:content>")
    expect(result).toContain("<dcssch:dataPath>ОбщееСостояниеПодключения</dcssch:dataPath>")
    expect(result).toContain("<v8:content>Настройки</v8:content>")
  })

  it("matches reference fields by dataPath when restoring explicit Asc", () => {
    const { result } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: [
        {
          itemType: "CalculatedField",
          dataPath: "ПредставлениеПериода",
          expression: "",
          orderExpressions: [
            {
              itemType: "CalculatedFieldOrderExpression",
              expression: "Дата",
              autoOrder: false,
            },
          ],
        },
      ],
      yaml: [
        {
          ПутьКДанным: "ПредставлениеПериода",
          Выражение: "",
          ВыраженияУпорядочивания: [{ Выражение: "Дата", Автоупорядочивание: "Ложь" }],
        },
      ],
      referenceMetadata: [
        {
          "dcssch:dataPath": "ДругоеПоле",
          "dcssch:expression": "",
        },
        {
          "dcssch:dataPath": "ПредставлениеПериода",
          "dcssch:expression": "",
          "dcssch:orderExpression": [
            {
              "dcssch:expression": "Дата",
              "dcssch:orderType": "Asc",
              "dcssch:autoOrder": "false",
            },
          ],
        },
      ],
      xmlRootTag: "CalculatedField",
    })

    expect(result).toContain("<dcssch:orderType>Asc</dcssch:orderType>")
  })
})
