import { describe, expect, it } from "vitest"
import {
  childUid,
  configurationUid,
  indexedUid,
  metadataItemUid,
  yamlIndexUid,
  yamlKeyUid,
  yamlPropertyUid,
} from "./logicalAddress"

describe("configuration index logical address", () => {
  it("builds semantic addresses used by reference-order-spec", () => {
    expect(configurationUid()).toBe("Конфигурация")
    expect(metadataItemUid("Документ", "ПоступлениеТоваровУслуг")).toBe("Документ.ПоступлениеТоваровУслуг")
    expect(childUid("Документ.ПоступлениеТоваровУслуг", "Форма", "ФормаДокумента")).toBe(
      "Документ.ПоступлениеТоваровУслуг.Форма.ФормаДокумента"
    )
    expect(indexedUid("Документ.ПоступлениеТоваровУслуг.Отбор", "Элемент", 0)).toBe(
      "Документ.ПоступлениеТоваровУслуг.Отбор.Элемент[0]"
    )
  })

  it("rejects empty segments and invalid indexes", () => {
    expect(() => metadataItemUid("", "Товары")).toThrow("Пустой сегмент logicalAddress")
    expect(() => childUid("Справочник.Товары", "Реквизит", "")).toThrow("Пустой сегмент logicalAddress")
    expect(() => indexedUid("Справочник.Товары", "Элемент", -1)).toThrow("Некорректный индекс logicalAddress")
  })

  it("escapes dots inside semantic segments", () => {
    expect(
      childUid(
        "БизнесПроцесс.ЗаявкаСотрудникаОтпуск.Форма.ДействиеВыполнить",
        "ДополнительныеКолонки",
        "Задание.Отпуска"
      )
    ).toBe("БизнесПроцесс.ЗаявкаСотрудникаОтпуск.Форма.ДействиеВыполнить.ДополнительныеКолонки.Задание%2EОтпуска")
  })

  it("builds DCS YAML-path property and collection addresses", () => {
    const owner = "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор"

    expect(yamlPropertyUid(owner, "Элементы")).toBe(
      "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Элементы"
    )
    expect(yamlIndexUid(yamlPropertyUid(owner, "Элементы"), 0)).toBe(
      "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Элементы[0]"
    )
    expect(yamlPropertyUid(yamlIndexUid(yamlPropertyUid(owner, "Элементы"), 0), "Поле")).toBe(
      "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Элементы[0].Поле"
    )
    expect(yamlKeyUid(yamlPropertyUid(owner, "Параметры"), "Период")).toBe(
      "Справочник.Товары.Форма.ФормаСписка.Атрибут.Список.Свойство.Отбор.Параметры.Период"
    )
  })

  it("rejects invalid DCS YAML-path array index", () => {
    expect(() => yamlIndexUid("Справочник.Товары", -1)).toThrow("Некорректный индекс logicalAddress")
  })
})
