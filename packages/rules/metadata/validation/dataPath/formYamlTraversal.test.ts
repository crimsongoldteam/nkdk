import { describe, expect, it } from "vitest"
import "../../forms"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import { collectFormDataPathOccurrencesFromYAML } from "./formYamlTraversal"

describe("collectFormDataPathOccurrencesFromYAML element visitor", () => {
  it("передаёт ближайшую таблицу через вложенные группы", () => {
    const visits: Array<{
      name: string
      itemType: string
      present: boolean
      value: unknown
      tableOwnerName?: string
    }> = []

    collectFormDataPathOccurrencesFromYAML({
      yaml: {
        Элементы: {
          Таблица: {
            Вид: "ТаблицаФормы",
            ПутьКДанным: "Объект.Таблица",
            Элементы: {
              ТаблицаКолонка: { Вид: "ПолеВвода" },
              Группа: {
                Вид: "ГруппаКолонок",
                Элементы: {
                  ВложеннаяГруппа: {
                    Вид: "ГруппаКолонок",
                    Элементы: {
                      КолонкаЧерезГруппы: {
                        Вид: "ПолеВвода",
                        ПутьКДанным: "Объект.Таблица.КолонкаЧерезГруппы",
                      },
                    },
                  },
                },
              },
            },
          },
          ВнешняяГруппа: {
            Вид: "Группа",
            Элементы: {
              ВложеннаяТаблица: {
                Вид: "ТаблицаФормы",
                Элементы: {
                  ВложеннаяТаблицаКолонка: { Вид: "ПолеВвода", ПутьКДанным: "" },
                },
              },
            },
          },
        },
      },
      rule: ClientApplicationFormRules,
      visitElement: ({ name, itemType, primaryDataPath, tableOwner }) => {
        visits.push({
          name,
          itemType,
          present: primaryDataPath?.present ?? false,
          value: primaryDataPath?.value,
          ...(tableOwner === undefined ? {} : { tableOwnerName: tableOwner.name }),
        })
      },
    })

    expect(visits).toEqual([
      { name: "Таблица", itemType: "Table", present: true, value: "Объект.Таблица" },
      {
        name: "ТаблицаКолонка",
        itemType: "TableInputField",
        present: false,
        value: undefined,
        tableOwnerName: "Таблица",
      },
      {
        name: "Группа",
        itemType: "ColumnGroup",
        present: false,
        value: undefined,
        tableOwnerName: "Таблица",
      },
      {
        name: "ВложеннаяГруппа",
        itemType: "ColumnGroup",
        present: false,
        value: undefined,
        tableOwnerName: "Таблица",
      },
      {
        name: "КолонкаЧерезГруппы",
        itemType: "TableInputField",
        present: true,
        value: "Объект.Таблица.КолонкаЧерезГруппы",
        tableOwnerName: "Таблица",
      },
      { name: "ВнешняяГруппа", itemType: "UsualGroup", present: false, value: undefined },
      { name: "ВложеннаяТаблица", itemType: "Table", present: false, value: undefined },
      {
        name: "ВложеннаяТаблицаКолонка",
        itemType: "TableInputField",
        present: true,
        value: "",
        tableOwnerName: "ВложеннаяТаблица",
      },
    ])
  })
})
