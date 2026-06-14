import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { importFromYAMLFunction } from "~/metadata/orchestration/property/fn"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importMetadataFieldFromYAML, importMetadataFieldsFromYAML } from "./fromYAML"

describe("importMetadataFieldFromYAML", () => {
  it("should import metadata field from enterprise", () => {
    const enterprise =
      "Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект"
    const result = importMetadataFieldFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual(
      "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект"
    )
  })

  it("should import metadata field from enterprise with tabular section", () => {
    const enterprise =
      "Справочник.АвтоматическиеСкидки.ТабличнаяЧасть.НоменклатураГруппыЦеновыеГруппы.Реквизит.ЗначениеУточнения"
    const result = importMetadataFieldFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual(
      "Catalog.АвтоматическиеСкидки.TabularSection.НоменклатураГруппыЦеновыеГруппы.Attribute.ЗначениеУточнения"
    )
  })

  it("should import with standard attribute", () => {
    const enterprise = "Справочник.ЗоныТарифыДоставки.СтандартныйРеквизит.Владелец"
    const result = importMetadataFieldFromYAML(mockContext, mockRule, enterprise)
    expect(result).toEqual("Catalog.ЗоныТарифыДоставки.StandardAttribute.Owner")
  })

  it("skips form-local data paths", () => {
    const enterprise = "Объект.Организация"
    expect(importMetadataFieldFromYAML(mockContext, mockRule, enterprise)).toBeUndefined()
  })

  it("rejects short field paths in registered metadata field importer", () => {
    const importFromYAML = getTypeRule("MetadataField", "importFromYAML") as importFromYAMLFunction

    expect(() =>
      importFromYAML(mockContext, { ...mockRule, type: "MetadataField" }, "Справочник.Номенклатура.Количество")
    ).toThrow('Неизвестный сегмент "Количество"')
  })

  it("imports full field paths in registered metadata field importer", () => {
    const importFromYAML = getTypeRule("MetadataField", "importFromYAML") as importFromYAMLFunction

    const result = importFromYAML(
      mockContext,
      { ...mockRule, type: "MetadataField" },
      "Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество"
    )

    expect(result).toEqual("Catalog.Номенклатура.TabularSection.Товары.Attribute.Количество")
  })

  it("imports full field paths in collections", () => {
    const result = importMetadataFieldsFromYAML(mockContext, { ...mockRule, type: "MetadataFields" }, [
      "Справочник.Номенклатура.Реквизит.Артикул",
    ])

    expect(result).toEqual(["Catalog.Номенклатура.Attribute.Артикул"])
  })
})
