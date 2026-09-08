import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"
import { collectBoundaryFormDataPaths, collectFormDataPathOccurrencesFromFacts } from "./formDataPathOccurrences"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../composition/metadataRules"

it("читает только присутствующие пути границы и не посещает вложенные элементы", () => {
  const execution = createRuleRegistrySet(metadataRules).execution
  const rule = { itemType: "InputField", properties: {
    dataPath: { type: "DataPath", yaml: "ПутьКДанным" },
    other: { type: "string", yaml: "НеПуть" },
  } } as const satisfies MetadataItemRule
  const yaml = { ПутьКДанным: "Объект.Код", get НеПуть(): never { throw new Error("Чужое значение") } }
  expect(collectBoundaryFormDataPaths({ execution, rule, yaml, yamlPath: ["Поле"] }))
    .toEqual([expect.objectContaining({ value: "Объект.Код", yamlPath: ["Поле", "ПутьКДанным"] })])
  expect(collectBoundaryFormDataPaths({ execution, rule, yaml: {}, yamlPath: [] })).toEqual([])
})

it("не перебирает сотни правил повторно для пустых границ одного типа", () => {
  const execution = createRuleRegistrySet(metadataRules).execution
  let enumerations = 0
  const properties = new Proxy({
    ...Object.fromEntries(Array.from({ length: 256 }, (_, index) => [String(index), { type: "string", yaml: `Поле${index}` }])),
    dataPath: { type: "DataPath", yaml: "ПутьКДанным" },
  }, { ownKeys(target) { enumerations += 1; return Reflect.ownKeys(target) } })
  const rule: MetadataItemRule = { itemType: "InputField", properties }
  collectBoundaryFormDataPaths({ execution, rule, yaml: { ПутьКДанным: "Объект.Код" }, yamlPath: [] })
  const preparedEnumerations = enumerations
  for (let index = 0; index < 100; index += 1) {
    expect(collectBoundaryFormDataPaths({ execution, rule, yaml: {}, yamlPath: [] })).toEqual([])
  }
  expect(enumerations).toBe(preparedEnumerations)
})

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
