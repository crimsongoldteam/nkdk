import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { isRedundantClientApplicationBaseForm } from "./baseFormNecessity"
import type { ClientApplicationFormYAML } from "./types"
import { equalClientApplicationBaseFormProjections, projectClientApplicationBaseForm } from "./baseFormProjection"
import { equalBaseFormYaml } from "./baseFormYaml"

describe("необходимость сохранённой основы формы", () => {
  it.each([
    [{}, {}],
    [{ ТипКнопки: "Обычная" }, {}],
    [{ ТипКнопки: "Обычная" }, { ТипКнопки: "Гиперссылка" }],
    [{ ТипКнопки: "Гиперссылка" }, { ТипКнопки: "Гиперссылка" }],
    [{ Ширина: 20 }, { Ширина: 21 }],
    [{ Подсказка: { ru: "Текст" } }, { Подсказка: { ru: "Другой" } }],
  ])("сравнение кнопки совпадает с обычными проекциями: %j / %j", (left, right) => {
    const leftBaseYaml = form({ Элементы: { Кнопка: { Вид: "Кнопка", ...left } } })
    const rightBaseYaml = form({ Элементы: { Кнопка: { Вид: "Кнопка", ...right } } })
    const extensionYaml = form({ Элементы: { Кнопка: { Вид: "Кнопка", ТипКнопки: "Обычная", Ширина: 20, Подсказка: { ru: "Текст" } } } })
    const expected = equalBaseFormYaml(
      projectClientApplicationBaseForm({ baseYaml: leftBaseYaml, extensionYaml }).yaml,
      projectClientApplicationBaseForm({ baseYaml: rightBaseYaml, extensionYaml }).yaml,
    )
    expect(equalClientApplicationBaseFormProjections({ leftBaseYaml, rightBaseYaml, extensionYaml })).toBe(expected)
  })

  it.each([
    ["ПолеВвода", "Высота", "Ширина"],
    ["Кнопка", "Ширина", "Высота"],
  ])("сравнивает свойства элемента %s до чтения следующего значения", (kind, first, later) => {
    const element = { Вид: kind, [first]: 99, [later]: 20 }
    Object.defineProperty(element, later, { enumerable: true, get() { throw new Error("Не читать после найденного отличия") } })
    const ordinary = form({ Элементы: { Поле: { Вид: kind, [first]: 20, [later]: 20 } } })
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: ordinary, extensionYaml: ordinary,
      savedBaseYaml: form({ Элементы: { Поле: element } }),
    })).toBe(false)
  })

  it("считает избыточной основу с теми же событиями и техническими полями", () => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: form({
        _version: "2.20",
        События: { ПриОткрытии: "ОбработкаОткрытия" },
        Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 20 } },
      }),
      extensionYaml: form({
        События: { ПриОткрытии: "ОбработкаОткрытия" },
        Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 20 } },
      }),
      savedBaseYaml: form({
        Элементы: { Поле: { Ширина: 20, Вид: "ПолеВвода", _id: "7" } },
        События: { ПриОткрытии: "ОбработкаОткрытия" },
      }),
    })).toBe(true)
  })

  it("не учитывает технические поля корня", () => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: form({ Ширина: 20 }),
      extensionYaml: form({ Ширина: 20 }),
      savedBaseYaml: form({ Ширина: 20, _uuid: "legacy" }),
    })).toBe(true)
  })

  it("сохраняет основу с отличающимся свойством", () => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: form({ Ширина: 20 }),
      extensionYaml: form({ Ширина: 20 }),
      savedBaseYaml: form({ Ширина: 99 }),
    })).toBe(false)
  })

  it.each([
    ["реквизитов", { Реквизиты: { Основа: { Тип: "Строка" } } }, { Реквизиты: { Другая: { Тип: "Строка" } } }],
    ["команд", { Команды: { Основа: {} } }, { Команды: { Другая: {} } }],
    ["параметров", { Параметры: { Основа: { Тип: "Строка" } } }, { Параметры: { Другая: { Тип: "Строка" } } }],
  ])("сохраняет основу с отличающимся составом %s", (_name, expected, saved) => {
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: form(expected),
      extensionYaml: form(expected),
      savedBaseYaml: form(saved),
    })).toBe(false)
  })

  it("учитывает иерархию элементов", () => {
    const hierarchical = {
      Элементы: {
        Группа: {
          Вид: "Группа",
          Элементы: { Поле: { Вид: "ПолеВвода" } },
        },
      },
    }
    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: form(hierarchical),
      extensionYaml: form(hierarchical),
      savedBaseYaml: form({ Элементы: { Поле: { Вид: "ПолеВвода" } } }),
    })).toBe(false)
  })

  it("останавливает сравнение на первом значимом отличии", () => {
    const savedBase = form({ Высота: 99, Ширина: 20 })
    Object.defineProperty(savedBase, "Ширина", {
      enumerable: true,
      get: () => {
        throw new Error("позднее свойство не должно читаться")
      },
    })

    expect(isRedundantClientApplicationBaseForm({
      currentConfigurationYaml: form({ Высота: 20, Ширина: 20 }),
      extensionYaml: form({ Высота: 20, Ширина: 20 }),
      savedBaseYaml: savedBase,
    })).toBe(false)
  })
})

function form(value: object): ClientApplicationFormYAML {
  return value as ClientApplicationFormYAML
}
