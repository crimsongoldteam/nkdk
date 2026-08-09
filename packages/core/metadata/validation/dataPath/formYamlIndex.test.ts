import { describe, expect, it } from "vitest"
import type { LocalYamlFact } from "../../orchestration/property/importYamlTypes"
import { createFormDataPathIndexCollector, createFormDataPathIndexFromYAML } from "./formYamlIndex"
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

  it("собирает путь к данным табличного элемента из rulePath", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    collector.acceptProperty(
      fact(
        ["Элементы", "ТаблицаТоваров", "ПутьКДанным"],
        "Объект.Товары",
        [
          { propertyKey: "childItems", nestedItemType: "Table" },
          { propertyKey: "dataPath" },
        ]
      )
    )

    expect(collector.finish().tableDataPathByElementName).toEqual(
      new Map([["ТаблицаТоваров", "Объект.Товары"]])
    )
  })

  it("собирает реквизиты и колонки только из событий свойств", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })

    collector.acceptProperty(fact(["Реквизиты", "Объект", "Тип"], "СправочникОбъект.Контрагенты"))
    collector.acceptProperty(fact(["Реквизиты", "Таблица", "Тип"], "ТаблицаЗначений"))
    collector.acceptProperty(fact(["Реквизиты", "Таблица", "Колонки", "Код", "Тип"], "Строка"))
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

  it.each(["Дата", "Время", "ДатаВремя"])("сводит %s к виду dateTime", (yamlType) => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    collector.acceptProperty(fact(["Реквизиты", "Период", "Тип"], yamlType))

    expect(collector.finish().getRoot("Период")?.typeInfo).toMatchObject({
      kinds: ["dateTime"],
      sourceText: "dateTime",
    })
  })

  it("не сохраняет переданные составные YAML-объекты", () => {
    const collector = createFormDataPathIndexCollector({ filePath: "Формы/Форма.yaml" })
    const value = { nested: { large: true } }
    collector.acceptProperty(fact(["Реквизиты", "Список", "ДинамическийСписок"], value))

    const index = collector.finish()
    value.nested.large = false

    expect(index.getRoot("Список")?.typeInfo).toMatchObject({ kinds: ["dynamicList", "tableSource"] })
  })
})

function fact(
  yamlPath: readonly (string | number)[],
  value: unknown,
  rulePath: LocalYamlFact["rulePath"] = []
): LocalYamlFact {
  return {
    yamlPath,
    rulePath,
    rule: { type: "TestFormYamlIndex" as never, yaml: String(yamlPath.at(-1)) },
    value,
  }
}
