import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { calculatedFields, calculatedFieldsYAML } from "./__fixtures__/data"

describe("import CalculatedFields from YAML", () => {
  it("imports YAML array", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedFields" },
      value: calculatedFieldsYAML,
    })

    expect(result).toEqual(calculatedFields)
  })

  it("preserves source order type by dataPath", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "CalculatedFields" },
      value: [
        {
          ПутьКДанным: "ПредставлениеПериода",
          Выражение: "",
          ВыраженияУпорядочивания: [
            {
              Выражение: "Дата",
              Автоупорядочивание: "Ложь",
            },
          ],
        },
      ],
      sourceValue: [
        {
          itemType: "CalculatedField",
          dataPath: "ДругоеПоле",
          expression: "",
        },
        {
          itemType: "CalculatedField",
          dataPath: "ПредставлениеПериода",
          expression: "",
          orderExpressions: [
            {
              itemType: "CalculatedFieldOrderExpression",
              expression: "Дата",
              orderType: "Asc",
              autoOrder: false,
            },
          ],
        },
      ],
    })

    expect(result).toEqual([
      {
        itemType: "CalculatedField",
        dataPath: "ПредставлениеПериода",
        expression: "",
        orderExpressions: [
          {
            itemType: "CalculatedFieldOrderExpression",
            expression: "Дата",
            orderType: "Asc",
            autoOrder: false,
          },
        ],
      },
    ])
  })
})
