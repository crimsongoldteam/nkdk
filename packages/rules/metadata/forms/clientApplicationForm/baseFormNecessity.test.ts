import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { isRedundantClientApplicationBaseForm } from "./baseFormNecessity"
import type { ClientApplicationFormYAML } from "./types"

describe("необходимость сохранённой основы формы", () => {
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
})

function form(value: object): ClientApplicationFormYAML {
  return value as ClientApplicationFormYAML
}
