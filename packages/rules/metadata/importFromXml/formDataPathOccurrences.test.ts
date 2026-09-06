import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"
import { collectFormDataPathOccurrencesFromFacts } from "./formDataPathOccurrences"

describe("пути формы из фактов", () => {
  it("выбирает путь и признаки поля, наследуя контекст таблицы без чтения соседнего текста", () => {
    const table = { itemType: "Table", properties: { dataPath: { type: "DataPath", yaml: "ПутьКДанным" } } } as const satisfies MetadataItemRule
    const field = { itemType: "InputField", properties: {
      dataPath: { type: "DataPath", yaml: "ПутьКДанным" },
      valuesPicture: { type: "string", yaml: "КартинкаЗначений" },
      multipleValuesExtendedEdit: { type: "boolean", yaml: "РасширенноеРедактирование" },
    } } as const satisfies MetadataItemRule
    const tablePath = ["Элементы", "Строки"]
    const fieldPath = [...tablePath, "Элементы", "Значение"]
    const result = collectFormDataPathOccurrencesFromFacts({
      projection: clientApplicationFormDataPathProjection,
      facts: [
        { itemType: field.itemType, itemRule: field, propertyKey: "dataPath", yamlPath: [...fieldPath, "ПутьКДанным"], value: "Значение" },
        { itemType: table.itemType, itemRule: table, propertyKey: "dataPath", yamlPath: [...tablePath, "ПутьКДанным"], value: "Строки" },
        { itemType: field.itemType, itemRule: field, propertyKey: "valuesPicture", yamlPath: [...fieldPath, "КартинкаЗначений"], value: "Картинка" },
        { itemType: field.itemType, itemRule: field, propertyKey: "multipleValuesExtendedEdit", yamlPath: [...fieldPath, "РасширенноеРедактирование"], value: true },
        { itemType: field.itemType, itemRule: field, propertyKey: "comment", yamlPath: [...fieldPath, "Комментарий"],
          get value(): unknown { throw new Error("Независимое поле не нужно проверке путей") } },
      ],
    })
    expect(result.find(({ value }) => value === "Значение")).toEqual({
      rule: field.properties.dataPath, value: "Значение", yamlPath: [...fieldPath, "ПутьКДанным"],
      nameMode: "yaml", elementType: "InputField", hasValuesPicture: true,
      hasMultipleValuesExtendedEdit: true, tableContext: { dataPath: "Строки" },
    })
  })
})
