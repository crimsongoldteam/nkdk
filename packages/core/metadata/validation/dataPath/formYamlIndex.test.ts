import { describe, expect, it } from "vitest"
import { createFormDataPathIndexFromYAML } from "../../forms/clientApplicationForm/formDataPathMetadata"
import { createFormDataPathIndexCollector } from "./formYamlIndex"
import { collectFormTableDataPathsFromYAML } from "../../forms/clientApplicationForm/formTableDataPaths"

describe("createFormDataPathIndexCollector", () => {
  it("собирает пути табличных элементов при прямом обходе YAML по rules", () => {
    const yaml = {
        Элементы: {
          ТаблицаТоваров: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Объект.Товары",
          },
        },
      }
    const index = createFormDataPathIndexFromYAML(
      yaml,
      collectFormTableDataPathsFromYAML(yaml)
    )

    expect(index.tableDataPathByElementName).toEqual(
      new Map([["ТаблицаТоваров", "Объект.Товары"]])
    )
  })

  it("собирает путь к данным табличного элемента", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    collector.acceptTableDataPath({ name: "ТаблицаТоваров", dataPath: "Объект.Товары" })

    expect(collector.finish().tableDataPathByElementName).toEqual(
      new Map([["ТаблицаТоваров", "Объект.Товары"]])
    )
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
