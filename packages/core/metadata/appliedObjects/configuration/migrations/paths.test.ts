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
    expect(parseMigrationPath("БизнесПроцесс.Согласование")).toMatchObject({
      kind: "object",
      localName: "Согласование",
      ownerPath: "БизнесПроцесс",
      levelPath: "БизнесПроцесс",
    })
    expect(parseMigrationPath("Задача.Исполнение")).toMatchObject({
      kind: "object",
      localName: "Исполнение",
      ownerPath: "Задача",
      levelPath: "Задача",
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
    expect(parseMigrationPath("ХранилищеНастроек.ПользовательскиеНастройки")).toMatchObject({
      kind: "object",
      localName: "ПользовательскиеНастройки",
      ownerPath: "ХранилищеНастроек",
      levelPath: "ХранилищеНастроек",
    })
    expect(parseMigrationPath("ЭлементСтиля.ОсновнойШрифт")).toMatchObject({
      kind: "object",
      localName: "ОсновнойШрифт",
      ownerPath: "ЭлементСтиля",
      levelPath: "ЭлементСтиля",
    })
    expect(parseMigrationPath("ОбщийРеквизит.Организация")).toMatchObject({
      kind: "object",
      localName: "Организация",
      ownerPath: "ОбщийРеквизит",
      levelPath: "ОбщийРеквизит",
    })
    expect(parseMigrationPath("Бот.Телеграм")).toMatchObject({
      kind: "object",
      localName: "Телеграм",
      ownerPath: "Бот",
      levelPath: "Бот",
    })
    expect(parseMigrationPath("ОбщаяФорма.КонстантаВсеСвойства")).toMatchObject({
      kind: "object",
      localName: "КонстантаВсеСвойства",
      ownerPath: "ОбщаяФорма",
      levelPath: "ОбщаяФорма",
    })
    expect(parseMigrationPath("WSСсылка.Калькулятор")).toMatchObject({
      kind: "object",
      localName: "Калькулятор",
      ownerPath: "WSСсылка",
      levelPath: "WSСсылка",
    })
    expect(parseMigrationPath("ПланСчетов.Основной")).toMatchObject({
      kind: "object",
      localName: "Основной",
      ownerPath: "ПланСчетов",
      levelPath: "ПланСчетов",
    })
    expect(parseMigrationPath("ПланВидовРасчета.Начисления")).toMatchObject({
      kind: "object",
      localName: "Начисления",
      ownerPath: "ПланВидовРасчета",
      levelPath: "ПланВидовРасчета",
    })
    expect(parseMigrationPath("ПланВидовХарактеристик.Свойства")).toMatchObject({
      kind: "object",
      localName: "Свойства",
      ownerPath: "ПланВидовХарактеристик",
      levelPath: "ПланВидовХарактеристик",
    })
    expect(parseMigrationPath("Отчет.Продажи")).toMatchObject({
      kind: "object",
      localName: "Продажи",
      ownerPath: "Отчет",
      levelPath: "Отчет",
    })
    expect(parseMigrationPath("Обработка.ЗагрузкаДанных")).toMatchObject({
      kind: "object",
      localName: "ЗагрузкаДанных",
      ownerPath: "Обработка",
      levelPath: "Обработка",
    })
    expect(parseMigrationPath("ЖурналДокументов.Продажи")).toMatchObject({
      kind: "object",
      localName: "Продажи",
      ownerPath: "ЖурналДокументов",
      levelPath: "ЖурналДокументов",
    })
    expect(parseMigrationPath("HTTPСервис.ExternalAPI")).toMatchObject({
      kind: "object",
      localName: "ExternalAPI",
      ownerPath: "HTTPСервис",
      levelPath: "HTTPСервис",
    })
    expect(parseMigrationPath("Перечисление.Статусы")).toMatchObject({
      kind: "object",
      localName: "Статусы",
      ownerPath: "Перечисление",
      levelPath: "Перечисление",
    })
    expect(parseMigrationPath("Константа.АвтоматическиВосстанавливатьОтборы")).toMatchObject({
      kind: "object",
      localName: "АвтоматическиВосстанавливатьОтборы",
      ownerPath: "Константа",
      levelPath: "Константа",
    })
    expect(parseMigrationPath("ОбщийМодуль.ОбщийМодульГлобальный")).toMatchObject({
      kind: "object",
      localName: "ОбщийМодульГлобальный",
      ownerPath: "ОбщийМодуль",
      levelPath: "ОбщийМодуль",
    })
    expect(parseMigrationPath("ОбщаяКоманда.АвизоПоОСВходящее")).toMatchObject({
      kind: "object",
      localName: "АвизоПоОСВходящее",
      ownerPath: "ОбщаяКоманда",
      levelPath: "ОбщаяКоманда",
    })
    expect(parseMigrationPath("ПакетXDTO.ПакетXDTOВсеСвойства")).toMatchObject({
      kind: "object",
      localName: "ПакетXDTOВсеСвойства",
      ownerPath: "ПакетXDTO",
      levelPath: "ПакетXDTO",
    })
    expect(parseMigrationPath("WebSocketКлиент.WebSocketКлиентВсеСвойства")).toMatchObject({
      kind: "object",
      localName: "WebSocketКлиентВсеСвойства",
      ownerPath: "WebSocketКлиент",
      levelPath: "WebSocketКлиент",
    })
    expect(parseMigrationPath("ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства")).toMatchObject({
      kind: "object",
      localName: "ВнешнийИсточникДанныхВсеСвойства",
      ownerPath: "ВнешнийИсточникДанных",
      levelPath: "ВнешнийИсточникДанных",
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
    expect(parseMigrationPath("БизнесПроцесс.Согласование.Реквизит.Комментарий")).toMatchObject({
      kind: "attribute",
      localName: "Комментарий",
      ownerPath: "БизнесПроцесс.Согласование",
      levelPath: "БизнесПроцесс.Согласование.Реквизит",
    })
    expect(parseMigrationPath("Задача.Исполнение.Реквизит.Срок")).toMatchObject({
      kind: "attribute",
      localName: "Срок",
      ownerPath: "Задача.Исполнение",
      levelPath: "Задача.Исполнение.Реквизит",
    })
    expect(parseMigrationPath("Отчет.Продажи.Реквизит.Период")).toMatchObject({
      kind: "attribute",
      localName: "Период",
      ownerPath: "Отчет.Продажи",
      levelPath: "Отчет.Продажи.Реквизит",
    })
    expect(parseMigrationPath("Обработка.ЗагрузкаДанных.Реквизит.Файл")).toMatchObject({
      kind: "attribute",
      localName: "Файл",
      ownerPath: "Обработка.ЗагрузкаДанных",
      levelPath: "Обработка.ЗагрузкаДанных.Реквизит",
    })
  })

  it("parses task addressing attribute paths", () => {
    expect(parseMigrationPath("Задача.Исполнение.РеквизитАдресации.Исполнитель")).toEqual({
      kind: "attribute",
      segments: ["Задача", "Исполнение", "РеквизитАдресации", "Исполнитель"],
      localName: "Исполнитель",
      ownerPath: "Задача.Исполнение",
      levelPath: "Задача.Исполнение.РеквизитАдресации",
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
    expect(parseMigrationPath("Отчет.Продажи.ТабличнаяЧасть.Показатели")).toMatchObject({
      kind: "tabularSection",
      localName: "Показатели",
      ownerPath: "Отчет.Продажи",
      levelPath: "Отчет.Продажи.ТабличнаяЧасть",
    })
    expect(parseMigrationPath("Обработка.ЗагрузкаДанных.ТабличнаяЧасть.Файлы")).toMatchObject({
      kind: "tabularSection",
      localName: "Файлы",
      ownerPath: "Обработка.ЗагрузкаДанных",
      levelPath: "Обработка.ЗагрузкаДанных.ТабличнаяЧасть",
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

  it("parses register child paths", () => {
    expect(parseMigrationPath("РегистрНакопления.Остатки.Ресурс.Количество")).toEqual({
      kind: "attribute",
      segments: ["РегистрНакопления", "Остатки", "Ресурс", "Количество"],
      localName: "Количество",
      ownerPath: "РегистрНакопления.Остатки",
      levelPath: "РегистрНакопления.Остатки.Ресурс",
    })
    expect(parseMigrationPath("РегистрНакопления.Остатки.Измерение.Склад")).toMatchObject({
      kind: "dimension",
      localName: "Склад",
      ownerPath: "РегистрНакопления.Остатки",
      levelPath: "РегистрНакопления.Остатки.Измерение",
    })
    expect(parseMigrationPath("РегистрСведений.Цены.Реквизит.Валюта")).toMatchObject({
      kind: "attribute",
      localName: "Валюта",
      ownerPath: "РегистрСведений.Цены",
      levelPath: "РегистрСведений.Цены.Реквизит",
    })
    expect(parseMigrationPath("РегистрБухгалтерии.Учет.Ресурс.Сумма")).toMatchObject({
      kind: "attribute",
      localName: "Сумма",
      ownerPath: "РегистрБухгалтерии.Учет",
      levelPath: "РегистрБухгалтерии.Учет.Ресурс",
    })
    expect(parseMigrationPath("РегистрРасчета.Начисления.Измерение.Сотрудник")).toMatchObject({
      kind: "dimension",
      localName: "Сотрудник",
      ownerPath: "РегистрРасчета.Начисления",
      levelPath: "РегистрРасчета.Начисления.Измерение",
    })
  })

  it("parses chart child paths", () => {
    expect(parseMigrationPath("ПланСчетов.Основной.Реквизит.КодГруппы")).toMatchObject({
      kind: "attribute",
      localName: "КодГруппы",
      ownerPath: "ПланСчетов.Основной",
      levelPath: "ПланСчетов.Основной.Реквизит",
    })
    expect(parseMigrationPath("ПланСчетов.Основной.ТабличнаяЧасть.Параметры")).toMatchObject({
      kind: "tabularSection",
      localName: "Параметры",
      ownerPath: "ПланСчетов.Основной",
      levelPath: "ПланСчетов.Основной.ТабличнаяЧасть",
    })
    expect(parseMigrationPath("ПланВидовРасчета.Начисления.ТабличнаяЧасть.Показатели.Реквизит.Значение")).toMatchObject({
      kind: "attribute",
      localName: "Значение",
      ownerPath: "ПланВидовРасчета.Начисления.ТабличнаяЧасть.Показатели",
      levelPath: "ПланВидовРасчета.Начисления.ТабличнаяЧасть.Показатели.Реквизит",
    })
  })

  it("builds rename target from local name", () => {
    expect(buildRenameTargetPath("Справочник.Товары.Реквизит.Артикул", "НовыйАртикул")).toBe(
      "Справочник.Товары.Реквизит.НовыйАртикул",
    )
    expect(buildRenameTargetPath("Справочник.Товары", "Номенклатура")).toBe("Справочник.Номенклатура")
    expect(buildRenameTargetPath("ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства", "НовыйИсточник")).toBe(
      "ВнешнийИсточникДанных.НовыйИсточник",
    )
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
    expect(() => parseMigrationPath("ХранилищеНастроек.ПользовательскиеНастройки.Форма.Основная")).toThrow(
      "Неподдерживаемый путь миграции",
    )
    expect(() => parseMigrationPath("ОбщийРеквизит.Организация.Реквизит.Код")).toThrow(
      "Неподдерживаемый путь миграции",
    )
    expect(() => parseMigrationPath("Бот.Телеграм.Реквизит.Код")).toThrow("Неподдерживаемый путь миграции")
    expect(() => parseMigrationPath("WSСсылка.Калькулятор.Форма.Основная")).toThrow(
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
