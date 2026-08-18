import { describe, expect, it } from "vitest"
import { collectConditionalAppearanceOccurrences } from "./conditionalAppearanceTraversal"

describe("collectConditionalAppearanceOccurrences", () => {
  it("обходит условное оформление формы и DynamicList, включая вложенные группы", () => {
    const yaml = {
      УсловноеОформлениеРеквизитов: {
        Элементы: [{
          Поля: ["ПолеФормы", { Поле: "РасширенноеПоле", Использование: "Истина" }],
          Отбор: { Элементы: [{
            ТипГруппы: "ГруппаИ",
            Элементы: [{ ЛевоеЗначение: ".Число", ПравоеЗначение: 0 }],
          }] },
        }],
      },
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ДинамическийСписок: {
            УсловноеОформление: {
              Элементы: [{
                Поля: ["Ссылка"],
                Отбор: { Элементы: [{ ЛевоеЗначение: ".Ссылка", ПравоеЗначение: ".Владелец" }] },
              }],
            },
          },
        },
      },
    }

    const result = collectConditionalAppearanceOccurrences(yaml)

    expect(result.targets.map(({ value, yamlPath, tableContext }) => ({ value, yamlPath, tableContext }))).toEqual([
      { value: "ПолеФормы", yamlPath: ["УсловноеОформлениеРеквизитов", "Элементы", 0, "Поля", 0], tableContext: undefined },
      { value: "РасширенноеПоле", yamlPath: ["УсловноеОформлениеРеквизитов", "Элементы", 0, "Поля", 1, "Поле"], tableContext: undefined },
      {
        value: "Ссылка",
        yamlPath: ["Реквизиты", "Список", "ДинамическийСписок", "УсловноеОформление", "Элементы", 0, "Поля", 0],
        tableContext: { dataPath: "Список" },
      },
    ])
    expect(result.operands.map(({ side, value, yamlPath, tableContext }) => ({ side, value, yamlPath, tableContext }))).toEqual([
      {
        side: "left",
        value: ".Число",
        yamlPath: ["УсловноеОформлениеРеквизитов", "Элементы", 0, "Отбор", "Элементы", 0, "Элементы", 0, "ЛевоеЗначение"],
        tableContext: undefined,
      },
      {
        side: "right",
        value: 0,
        yamlPath: ["УсловноеОформлениеРеквизитов", "Элементы", 0, "Отбор", "Элементы", 0, "Элементы", 0, "ПравоеЗначение"],
        tableContext: undefined,
      },
      {
        side: "left",
        value: ".Ссылка",
        yamlPath: ["Реквизиты", "Список", "ДинамическийСписок", "УсловноеОформление", "Элементы", 0, "Отбор", "Элементы", 0, "ЛевоеЗначение"],
        tableContext: { dataPath: "Список" },
      },
      {
        side: "right",
        value: ".Владелец",
        yamlPath: ["Реквизиты", "Список", "ДинамическийСписок", "УсловноеОформление", "Элементы", 0, "Отбор", "Элементы", 0, "ПравоеЗначение"],
        tableContext: { dataPath: "Список" },
      },
    ])
  })

  it("принимает отсутствие Поля и сохраняет пустое поле", () => {
    const yaml = {
      УсловноеОформлениеРеквизитов: {
        Элементы: [{ Отбор: { Элементы: [{ ЛевоеЗначение: ".", ПравоеЗначение: true }] } }],
      },
    }

    const result = collectConditionalAppearanceOccurrences(yaml)
    expect(result.targets).toEqual([])
    expect(result.operands.map((item) => item.value)).toEqual([".", true])
  })
})
