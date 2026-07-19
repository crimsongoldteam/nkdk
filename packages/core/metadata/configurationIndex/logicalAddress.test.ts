import { describe, expect, it } from "vitest"
import { childUid, configurationUid, indexedUid, metadataItemUid } from "./logicalAddress"

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
})
