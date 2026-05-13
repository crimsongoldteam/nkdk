import { describe, expect, it } from "vitest"
import { buildRenameTargetPath, parseMigrationPath } from "./paths"

describe("migration paths", () => {
  it("parses top level object paths", () => {
    expect(parseMigrationPath("Справочник.Товары")).toEqual({
      kind: "object",
      segments: ["Справочник", "Товары"],
      localName: "Товары",
      ownerPath: "Справочник",
      levelPath: "Справочник",
    })
  })

  it("parses simple top level applied object paths", () => {
    expect(parseMigrationPath("ОпределяемыйТип.ТипДокумента")).toMatchObject({
      kind: "object",
      localName: "ТипДокумента",
      ownerPath: "ОпределяемыйТип",
      levelPath: "ОпределяемыйТип",
    })
    expect(parseMigrationPath("ПараметрСеанса.ТекущийПользователь")).toMatchObject({
      kind: "object",
      localName: "ТекущийПользователь",
      ownerPath: "ПараметрСеанса",
      levelPath: "ПараметрСеанса",
    })
    expect(parseMigrationPath("ПодпискаНаСобытие.ПриЗаписи")).toMatchObject({
      kind: "object",
      localName: "ПриЗаписи",
      ownerPath: "ПодпискаНаСобытие",
      levelPath: "ПодпискаНаСобытие",
    })
    expect(parseMigrationPath("КритерийОтбора.ПоСкладу")).toMatchObject({
      kind: "object",
      localName: "ПоСкладу",
      ownerPath: "КритерийОтбора",
      levelPath: "КритерийОтбора",
    })
    expect(parseMigrationPath("ПараметрФункциональныхОпций.Организация")).toMatchObject({
      kind: "object",
      localName: "Организация",
      ownerPath: "ПараметрФункциональныхОпций",
      levelPath: "ПараметрФункциональныхОпций",
    })
    expect(parseMigrationPath("ЭлементСтиля.ОсновнойШрифт")).toMatchObject({
      kind: "object",
      localName: "ОсновнойШрифт",
      ownerPath: "ЭлементСтиля",
      levelPath: "ЭлементСтиля",
    })
  })

  it("parses object attribute paths", () => {
    expect(parseMigrationPath("Справочник.Товары.Реквизит.Артикул")).toEqual({
      kind: "attribute",
      segments: ["Справочник", "Товары", "Реквизит", "Артикул"],
      localName: "Артикул",
      ownerPath: "Справочник.Товары",
      levelPath: "Справочник.Товары.Реквизит",
    })
  })

  it("parses tabular section paths", () => {
    expect(parseMigrationPath("Документ.Заказ.ТабличнаяЧасть.Товары")).toEqual({
      kind: "tabularSection",
      segments: ["Документ", "Заказ", "ТабличнаяЧасть", "Товары"],
      localName: "Товары",
      ownerPath: "Документ.Заказ",
      levelPath: "Документ.Заказ.ТабличнаяЧасть",
    })
  })

  it("parses tabular section attribute paths", () => {
    expect(parseMigrationPath("Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит.Количество")).toMatchObject({
      kind: "attribute",
      localName: "Количество",
      ownerPath: "Документ.Заказ.ТабличнаяЧасть.Товары",
      levelPath: "Документ.Заказ.ТабличнаяЧасть.Товары.Реквизит",
    })
  })

  it("parses sequence dimension paths", () => {
    expect(parseMigrationPath("Последовательность.Нумерация.Измерение.Организация")).toEqual({
      kind: "dimension",
      segments: ["Последовательность", "Нумерация", "Измерение", "Организация"],
      localName: "Организация",
      ownerPath: "Последовательность.Нумерация",
      levelPath: "Последовательность.Нумерация.Измерение",
    })
  })

  it("builds rename target from local name", () => {
    expect(buildRenameTargetPath("Справочник.Товары.Реквизит.Артикул", "НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.НовыйАртикул",
    )
    expect(buildRenameTargetPath("Справочник.Товары", "Номенклатура")).toBe("Справочник.Номенклатура")
  })

  it("rejects empty rename target local name", () => {
    expect(() => buildRenameTargetPath("Справочник.Товары", "")).toThrow("Новое имя не должно быть пустым")
  })

  it("rejects rename target local name with dot", () => {
    expect(() => buildRenameTargetPath("Справочник.Товары", "Новая.Группа")).toThrow(
      "Новое имя не должно содержать точку",
    )
  })

  it("rejects rename target matching current local name", () => {
    expect(() => buildRenameTargetPath("Справочник.Товары", "Товары")).toThrow(
      "Переименование в то же имя запрещено",
    )
  })

  it("rejects unsupported segments", () => {
    expect(() => parseMigrationPath("Справочник.Товары.Команда.Открыть")).toThrow("Неподдерживаемый путь миграции")
  })

  it("rejects child paths for numerators", () => {
    expect(() => parseMigrationPath("Нумератор.Ном.Реквизит.Код")).toThrow("Неподдерживаемый путь миграции")
  })

  it("rejects child paths for simple top level applied objects", () => {
    expect(() => parseMigrationPath("ОпределяемыйТип.ТипДокумента.Реквизит.Код")).toThrow(
      "Неподдерживаемый путь миграции",
    )
    expect(() => parseMigrationPath("ЭлементСтиля.ОсновнойШрифт.Реквизит.Код")).toThrow(
      "Неподдерживаемый путь миграции",
    )
    expect(() => parseMigrationPath("КритерийОтбора.ПоСкладу.Форма.ФормаСписка")).toThrow(
      "Неподдерживаемый путь миграции",
    )
  })

  it("rejects tabular section paths for sequences", () => {
    expect(() => parseMigrationPath("Последовательность.Рег.ТабличнаяЧасть.Товары")).toThrow(
      "Неподдерживаемый путь миграции",
    )
  })

  it("rejects paths with empty segments", () => {
    expect(() => parseMigrationPath("Справочник.")).toThrow("Неподдерживаемый путь миграции")
    expect(() => parseMigrationPath("Справочник.Товары.Реквизит.")).toThrow("Неподдерживаемый путь миграции")
  })
})
