import { describe, expect, it } from "vitest"
import "../../../tests/metadataExecutionContext"
import { mockContextFromXML } from "../../../tests/mockContext"
import { exportToYAML } from "@nkdk/runtime"
import { explicitYAMLString, isExplicitYAMLString, parseMetadataYaml } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { withConfigurationIndexCollector } from "@nkdk/runtime"
import type { ClientApplicationFormXML } from "./types"
import {
  equalBaseFormYaml,
  importBaseFormYaml,
  normalizeBaseFormYaml,
} from "./baseFormYaml"

describe("base form YAML", () => {
  it("не считает namespaces, UUID и числовые id смысловыми данными", () => {
    const first = importBaseFormYaml({
      context: context(),
      baseFormXML: formXML("1", "urn:first", "11111111-1111-1111-1111-111111111111"),
      formName: "ФормаЭлемента",
    })
    const second = importBaseFormYaml({
      context: context(),
      baseFormXML: formXML("99", "urn:second", "22222222-2222-2222-2222-222222222222"),
      formName: "ФормаЭлемента",
    })

    expect(equalBaseFormYaml(first.yaml, second.yaml)).toBe(true)
    expect(JSON.stringify(first.yaml)).not.toMatch(/urn:first|11111111|\"_id\"/)
  })

  it("пишет индекс только под логическим корнем основы", () => {
    const imported = importBaseFormYaml({
      context: context(),
      baseFormXML: formXML("7", "urn:test", "11111111-1111-1111-1111-111111111111"),
      formName: "ФормаЭлемента",
    })
    const entities = imported.configurationIndexCollector.fragment("БазоваяФорма.yaml").entities

    expect(entities.length).toBeGreaterThan(0)
    expect(entities.every(({ logicalAddress }) =>
      logicalAddress.startsWith("Справочник.Товары.Форма.ФормаЭлемента.ОсноваФормы")
    )).toBe(true)
  })

  it("игнорирует порядок ключей объектов, но различает значимое свойство", () => {
    expect(equalBaseFormYaml(
      { Ширина: 10, Заголовок: "Форма" },
      { Заголовок: "Форма", Ширина: 10 },
    )).toBe(true)
    expect(equalBaseFormYaml({ Ширина: 10 }, { Ширина: 12 })).toBe(false)
  })

  it("различает вид, состав, порядок и иерархию элементов", () => {
    const field = { ПолеВвода: { Имя: "Поле" } }
    const label = { ДекорацияНадпись: { Имя: "Поле" } }
    const button = { Кнопка: { Имя: "Кнопка" } }

    expect(equalBaseFormYaml({ Элементы: [field] }, { Элементы: [label] })).toBe(false)
    expect(equalBaseFormYaml({ Элементы: [field] }, { Элементы: [field, button] })).toBe(false)
    expect(equalBaseFormYaml({ Элементы: [field, button] }, { Элементы: [button, field] })).toBe(false)
    expect(equalBaseFormYaml(
      { Элементы: [field, button] },
      { Элементы: [{ Группа: { Имя: "Группа", Элементы: [field, button] } }] },
    )).toBe(false)
  })

  it("нормализует только служебные поля XML-представления", () => {
    expect(normalizeBaseFormYaml({
      _xmlns: "urn:test",
      "_xmlns:v8": "urn:v8",
      _uuid: "uuid",
      _id: "7",
      _version: "2.20",
      Значение: 1,
      Вложенный: { _id: 8, Имя: "Поле" },
    })).toEqual({ Значение: 1, Вложенный: { Имя: "Поле" } })
  })

  it("сохраняет смысловое пустое значение", () => {
    const normalized = normalizeBaseFormYaml({
      ПараметрыВыбора: { "Отбор.Ссылка": undefined },
    })

    expect(normalized).toEqual({
      ПараметрыВыбора: { "Отбор.Ссылка": undefined },
    })
    expect(exportToYAML(normalized)).toContain("Отбор.Ссылка:")
  })

  it("сохраняет явные строки списка выбора при нормализации", () => {
    const normalized = normalizeBaseFormYaml({
      СписокВыбора: [{ Представление: "Массив", Значение: explicitYAMLString("Массив") }],
    }) as { СписокВыбора: Array<{ Значение: unknown }> }

    expect(isExplicitYAMLString(normalized.СписокВыбора[0]?.Значение)).toBe(true)
    expect(exportToYAML(normalized)).toContain('Значение: "Массив"')
    expect(exportToYAML(normalized)).not.toContain("value:")
  })

  it("сохраняет кавычки строк после чтения YAML", () => {
    const parsed = parseMetadataYaml("СписокВыбора:\n  - Значение: \"0\"\n").data
    const normalized = normalizeBaseFormYaml(parsed) as {
      СписокВыбора: Array<{ Значение: unknown }>
    }

    expect(normalized.СписокВыбора[0]?.Значение).toBe("0")
    expect(isExplicitYAMLString(normalized.СписокВыбора[0]?.Значение)).toBe(false)
    expect(exportToYAML(normalized)).toContain('Значение: "0"')
  })
})

function context() {
  return withConfigurationIndexCollector(
    mockContextFromXML(),
    createConfigurationIndexCollector(),
    "Справочник.Товары.Форма.ФормаЭлемента",
  )
}

function formXML(id: string, namespace: string, uuid: string): ClientApplicationFormXML {
  return {
    _xmlns: namespace,
    _uuid: uuid,
    Width: 10,
    Attributes: {
      Attribute: [{ _name: "Реквизит", _id: id, Type: {} }],
    },
    AutoCommandBar: {
      CommandBar: { _name: "ФормаКоманднаяПанель", _id: id },
    },
  }
}
