import { describe, expect, it } from "vitest"
import { createFormDataPathIndexFromYAML } from "../../forms/clientApplicationForm/formDataPathMetadata"
import { createFormDataPathIndexCollector } from "./formYamlIndex"

describe("createFormDataPathIndexCollector", () => {
  it("собирает объявления таблиц и деревьев с путём и без пути", () => {
    const yaml = {
        Элементы: {
          ТаблицаТоваров: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Объект.Товары",
          },
          ДеревоГрупп: {
            Вид: "ДеревоФормы",
          },
          ПолеВвода: {
            Вид: "ПолеВвода",
          },
        },
      }
    const index = createFormDataPathIndexFromYAML(yaml)

    expect(index.tabularElementsByName).toEqual(new Map([
      ["ТаблицаТоваров", { kind: "tabularFormElement", dataPath: "Объект.Товары" }],
      ["ДеревоГрупп", { kind: "tabularFormElement" }],
    ]))
  })

  it("дополняет объявленный табличный элемент путём независимо от порядка фактов", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    collector.declareTabularElement({ name: "ТаблицаТоваров" })
    collector.declareTabularElement({ name: "ТаблицаТоваров", dataPath: "Объект.Товары" })

    expect(collector.finish().tabularElementsByName).toEqual(new Map([
      ["ТаблицаТоваров", { kind: "tabularFormElement", dataPath: "Объект.Товары" }],
    ]))
  })

  it("собирает объявленные реквизиты и колонки", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })

    collector.setAttributeType("Объект", { type: ["CatalogObject.Контрагенты"] })
    collector.setAttributeType("Таблица", { type: ["ValueTable"] })
    collector.setColumnType("Таблица", "Код", { type: ["string"] })
    const index = collector.finish()

    expect(index.getRoot("Объект")).toMatchObject({
      kind: "formAttribute",
      typeInfo: { nextTypes: [{ kind: "СправочникОбъект", name: "Контрагенты" }] },
    })
    expect(index.getRoot("Таблица")?.tableSource?.columns.get("Код")).toMatchObject({
      name: "Код",
      typeInfo: { kinds: ["scalar"] },
    })
  })

  it.each(["Дата", "Время", "ДатаВремя"])("сводит %s к виду dateTime", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    collector.setAttributeType("Период", { type: ["dateTime"] })

    expect(collector.finish().getRoot("Период")?.typeInfo).toMatchObject({
      kinds: ["dateTime"],
      sourceText: "dateTime",
    })
  })

  it("объявление после типа не заменяет уточнённый тип произвольным", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    collector.setDynamicList("Список")
    collector.declareAttribute("Список")

    const index = collector.finish()

    expect(index.getRoot("Список")?.typeInfo).toMatchObject({ kinds: ["dynamicList", "tableSource"] })
  })
})
