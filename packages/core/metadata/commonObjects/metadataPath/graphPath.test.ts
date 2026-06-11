import { describe, expect, it } from "vitest"
import {
  canonicalizeMetadataGraphPath,
  canonicalizeMetadataTypeGraphPath,
  canonicalizeMetadataValueGraphPath,
  canonicalizeRuntimeObjectPath,
  isKnownMetadataGraphRootSegment,
  isRuntimeRootSegment,
} from "./graphPath"

describe("metadata graph path canonicalization", () => {
  it.each([
    ["Справочник.Товары", "Catalog.Товары"],
    ["Документ.Заказ", "Document.Заказ"],
    ["Справочник.Товары.Реквизит.Артикул", "Catalog.Товары.Attribute.Артикул"],
    ["Документ.Заказ.ТабличнаяЧасть.Товары", "Document.Заказ.TabularSection.Товары"],
    ["Документ.Заказ.СтандартныйРеквизит.Ссылка", "Document.Заказ.StandardAttribute.Ref"],
    ["Document.Заказ.StandardAttribute.Date", "Document.Заказ.StandardAttribute.Date"],
    ["Документ.Заказ.СтандартныйРеквизит.Number", "Document.Заказ.StandardAttribute.Number"],
    ["ОбщаяКоманда.Напомнить", "CommonCommand.Напомнить"],
    ["Отчет.X.Команда.Y", "Report.X.Command.Y"],
    ["Обработка.X.Команда.Y", "DataProcessor.X.Command.Y"],
    ["ДокументОбъект.Заказ.Number", "Document.Заказ.StandardAttribute.Number"],
  ])("canonicalizes %s", (input, expected) => {
    expect(canonicalizeMetadataGraphPath(input)).toBe(expected)
  })

  it.each([
    ["DocumentObject.Заказ.ТабличнаяЧасть.Товары", "Document.Заказ.TabularSection.Товары"],
    ["ДокументОбъект.Заказ.Number", "Document.Заказ.StandardAttribute.Number"],
    ["CatalogObject.Номенклатура.Description", "Catalog.Номенклатура.StandardAttribute.Description"],
    ["СправочникОбъект.Номенклатура.Реквизит.Артикул", "Catalog.Номенклатура.Attribute.Артикул"],
  ])("canonicalizes runtime object path %s", (input, expected) => {
    expect(canonicalizeRuntimeObjectPath(input)).toBe(expected)
  })

  it.each([
    ["DocumentObject.Заказ.Товары", "Document.Заказ.Товары"],
    ["CatalogObject.Номенклатура.Артикул", "Catalog.Номенклатура.Артикул"],
  ])("preserves unknown runtime child kind in %s", (input, expected) => {
    expect(canonicalizeRuntimeObjectPath(input)).toBe(expected)
  })

  it("uses explicit fallback kind for unknown runtime child paths", () => {
    expect(
      canonicalizeRuntimeObjectPath("DocumentObject.Заказ.Товары", {
        defaultChildKind: "TabularSection",
      }),
    ).toBe("Document.Заказ.TabularSection.Товары")
  })

  it.each([
    ["DocumentObject", true],
    ["ДокументОбъект", true],
    ["Catalog", false],
    ["Object", false],
    ["MyTable", false],
  ])("detects runtime root segment %s", (segment, expected) => {
    expect(isRuntimeRootSegment(segment)).toBe(expected)
  })

  it.each([
    ["Document", true],
    ["Документ", true],
    ["DocumentObject", true],
    ["ДокументОбъект", true],
    ["Object", false],
    ["MyTable", false],
  ])("detects known metadata graph root segment %s", (segment, expected) => {
    expect(isKnownMetadataGraphRootSegment(segment)).toBe(expected)
  })

  it.each([
    ["ОпределяемыйТип.ДенежнаяСумма", "DefinedType.ДенежнаяСумма"],
    ["ПланСчетов.Хозрасчетный", "ChartOfAccounts.Хозрасчетный"],
    ["ПланВидовХарактеристик.ВидыБюджетов", "ChartOfCharacteristicTypes.ВидыБюджетов"],
    ["CatalogObject.Номенклатура", "Catalog.Номенклатура"],
    ["DocumentObject.Заказ", "Document.Заказ"],
  ])("canonicalizes type path %s", (input, expected) => {
    expect(canonicalizeMetadataTypeGraphPath(input)).toBe(expected)
  })

  it.each([
    ["Справочник.СтавкиНДС.БезНДС", "Catalog.СтавкиНДС.PredefinedData.БезНДС"],
    [
      "ПланВидовХарактеристик.ВидыБюджетов.БюджетДвиженияДенежныхСредств",
      "ChartOfCharacteristicTypes.ВидыБюджетов.PredefinedData.БюджетДвиженияДенежныхСредств",
    ],
    ["ПланСчетов.Хозрасчетный.Основной", "ChartOfAccounts.Хозрасчетный.PredefinedData.Основной"],
    ["Catalog.СтавкиНДС.EmptyRef", "Catalog.СтавкиНДС.EmptyRef"],
    ["Enum.ВидыДоговоров.EnumValue.СПоставщиком", "Enum.ВидыДоговоров.СПоставщиком"],
    ["Перечисление.ВидыДоговоров.EnumValue.СПоставщиком", "Enum.ВидыДоговоров.СПоставщиком"],
    ["Enum.Статус.EmptyRef", "Enum.Статус.EmptyRef"],
  ])("canonicalizes value path %s", (input, expected) => {
    expect(canonicalizeMetadataValueGraphPath(input)).toBe(expected)
  })
})
