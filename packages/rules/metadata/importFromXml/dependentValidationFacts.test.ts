import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { MetadataCatalogRules } from "../appliedObjects/metadataCatalog/rules"
import { selectDependentValidationFacts } from "./dependentValidationFacts"

describe("отбор входа зависимых проверок", () => {
  it("выбирает проверяемое значение и объявленный тип, не читая соседний текст", () => {
    const selected = selectDependentValidationFacts({
      rule: MetadataCatalogRules, owner: { dir: "Справочник", name: "Товары" },
      candidates: [{ itemType: "MetadataAttribute", itemName: "Код", itemYamlPath: ["Реквизиты", "Код"],
        propertyKey: "fillValue", yamlPath: ["Реквизиты", "Код", "ЗначениеЗаполнения"], xmlValue: "значение", presentInXML: true }],
      facts: [
        { itemType: "MetadataAttribute", propertyKey: "type", yamlPath: ["Реквизиты", "Код", "Тип"], value: "Строка" },
        { itemType: "MetadataAttribute", propertyKey: "fillValue", yamlPath: ["Реквизиты", "Код", "ЗначениеЗаполнения"], value: "значение" },
        { itemType: "MetadataAttribute", propertyKey: "comment", yamlPath: ["Реквизиты", "Код", "Комментарий"],
          get value(): unknown { throw new Error("Соседний текст не нужен проверке") } },
      ],
    })
    expect(selected).toEqual({ Реквизиты: { Код: { Тип: "Строка", ЗначениеЗаполнения: "значение" } } })
  })
})
