import { describe, expect, it } from "vitest"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"

describe("createFormDataPathIndexFromYAML", () => {
  it("индексирует произвольный реквизит и произвольную колонку", () => {
    const index = createFormDataPathIndexFromYAML({
      Реквизиты: {
        ПроизвольныйРеквизит: {},
        Таблица: {
          Тип: "ТаблицаЗначений",
          Колонки: { Значение: {} },
        },
      },
    })

    expect(index.getRoot("ПроизвольныйРеквизит")?.typeInfo).toEqual({
      kinds: ["any"],
      nextTypes: [],
      sourceText: "Произвольный",
    })
    expect(index.getRoot("Таблица")?.tableSource).toMatchObject({
      hasColumns: true,
      columns: new Map([
        [
          "Значение",
          {
            name: "Значение",
            typeInfo: { kinds: ["any"], nextTypes: [], sourceText: "Произвольный" },
          },
        ],
      ]),
    })
  })

  it("индексирует путь к данным табличного элемента без отдельного прохода вызывающего кода", () => {
    const index = createFormDataPathIndexFromYAML({
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Объект.Товары",
        },
      },
    })

    expect(index.tableDataPathByElementName).toEqual(new Map([["Таблица", "Объект.Товары"]]))
  })
})
