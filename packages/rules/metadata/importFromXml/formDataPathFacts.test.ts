import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"
import { createFormDataPathIndexFromYAML } from "../forms/clientApplicationForm/formDataPathMetadata"
import { createFormDataPathIndexFromFacts } from "./formDataPathFacts"

describe("индекс путей из выбранных фактов", () => {
  it("сохраняет приоритет динамического списка независимо от порядка XML и не читает посторонние значения", () => {
    const ownerPath = ["Реквизиты", "Список"]
    const actual = createFormDataPathIndexFromFacts({
      projection: clientApplicationFormDataPathProjection,
      localIndexes: { metadata: { events: [{
        kind: "item", itemType: "FormAttribute", name: "Список", yamlPath: ownerPath,
        rulePath: [{ propertyKey: "attributes", nestedItemType: "FormAttribute" }],
      }, ...[["dynamicList", "ДинамическийСписок"], ["type", "Тип"]].map(([key, yaml]) => ({
        kind: "property" as const, propertyType: "string", yamlPath: [...ownerPath, yaml!],
        rulePath: [{ propertyKey: "attributes", nestedItemType: "FormAttribute" }, { propertyKey: key! }],
      }))] } },
      facts: [
        { itemType: "FormAttribute", propertyKey: "dynamicList", yamlPath: [...ownerPath, "ДинамическийСписок"], value: {} },
        { itemType: "FormAttribute", propertyKey: "type", yamlPath: [...ownerPath, "Тип"], value: "Строка" },
        { itemType: "FormAttribute", propertyKey: "comment", yamlPath: [...ownerPath, "Комментарий"],
          get value(): unknown { throw new Error("Постороннее значение не нужно индексу путей") } },
      ],
    })
    const expected = createFormDataPathIndexFromYAML({ Реквизиты: { Список: { Тип: "Строка", ДинамическийСписок: {} } } })
    expect(actual.roots).toEqual(expected.roots)
    expect(actual.roots.get("Список")?.typeInfo.kinds).toEqual(["dynamicList", "tableSource"])
  })
})
