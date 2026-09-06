import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { InputFieldRules } from "../forms/elements/inputField/rules"
import { TableRules } from "../forms/elements/table/rules"
import { FormAttributeRules } from "../forms/commonObjects/formAttribute/rules"
import { createFormDataPathIndexFromYAML } from "../forms/clientApplicationForm/formDataPathMetadata"
import { collectFormDataPathPreparationFromFacts, selectFormDataPathPreparationFacts } from "./formDataPathPreparation"

describe("вход контекста путей из фактов", () => {
  it("оставляет только входы путей, не читая и не копируя посторонние значения", () => {
    const facts = [
      { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "$formElementKind",
        yamlPath: ["Элементы", "Поле", "Вид"], value: "ПолеВвода" },
      { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "dataPath",
        yamlPath: ["Элементы", "Поле", "ПутьКДанным"], value: "Объект.Код" },
      { itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "mainAttribute",
        yamlPath: ["Реквизиты", "Объект", "ОсновнойРеквизит"], value: "Истина" },
      { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "multipleValuesExtendedEdit",
        yamlPath: ["Элементы", "Поле", "РасширенноеРедактированиеМножественныхЗначений"], value: false },
      { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "comment",
        yamlPath: ["Элементы", "Поле", "Комментарий"],
        get value(): unknown { throw new Error("Ненужное значение должно быть освобождено без чтения") } },
    ]
    const selected = selectFormDataPathPreparationFacts(facts)
    expect(selected).toHaveLength(4)
    selected.forEach((fact, index) => expect(fact).toBe(facts[index]))
  })

  it("сохраняет отсутствующий и пустой путь, имя основного реквизита и владельца колонки", () => {
    const index = createFormDataPathIndexFromYAML({ Реквизиты: { Объект: { Тип: "Строка" } } })
    const result = collectFormDataPathPreparationFromFacts({
      index,
      facts: [
        { itemType: "FormAttribute", itemRule: FormAttributeRules, propertyKey: "mainAttribute",
          yamlPath: ["Реквизиты", "Объект", "ОсновнойРеквизит"], value: "Истина" },
        { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "$formElementKind",
          yamlPath: ["Элементы", "Поле", "Вид"], value: "ПолеВвода" },
        { itemType: "Table", itemRule: TableRules, propertyKey: "$formElementKind",
          yamlPath: ["Элементы", "Таблица", "Вид"], value: "ТаблицаФормы" },
        { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "$formElementKind",
          yamlPath: ["Элементы", "Таблица", "Элементы", "Колонка", "Вид"], value: "ПолеВвода" },
        { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "dataPath",
          yamlPath: ["Элементы", "Таблица", "Элементы", "Колонка", "ПутьКДанным"], value: "" },
        { itemType: "InputField", itemRule: InputFieldRules, propertyKey: "comment",
          yamlPath: ["Элементы", "Поле", "Комментарий"],
          get value(): unknown { throw new Error("Комментарий не нужен контексту путей") } },
      ],
    })
    expect(result.index).toBe(index)
    expect(result.effectiveMainAttribute).toBe("Объект")
    expect(result.collected.elementsByName.get("Поле")).toMatchObject({ present: false, value: undefined })
    expect(result.collected.elementsByName.get("Колонка")).toMatchObject({
      present: true, value: "", tableOwnerName: "Таблица",
      yamlPath: ["Элементы", "Таблица", "Элементы", "Колонка"],
    })
    expect(result.collected).not.toHaveProperty("occurrences")
  })
})
