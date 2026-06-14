import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataFieldToYAML } from "./toYAML"

describe("exportMetadataFieldToYAML", () => {
  it("should export metadata field to enterprise", () => {
    const metadataField =
      "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект"
    const result = exportMetadataFieldToYAML(mockContext, mockRule, metadataField)
    expect(result).toEqual(
      "Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект"
    )
  })

  it("should export metadata field to enterprise with tabular section", () => {
    const metadataField =
      "Catalog.АвтоматическиеСкидки.TabularSection.НоменклатураГруппыЦеновыеГруппы.Attribute.ЗначениеУточнения"
    const result = exportMetadataFieldToYAML(mockContext, mockRule, metadataField)
    expect(result).toEqual(
      "Справочник.АвтоматическиеСкидки.ТабличнаяЧасть.НоменклатураГруппыЦеновыеГруппы.Реквизит.ЗначениеУточнения"
    )
  })

  it("should export with standard attribute", () => {
    const metadataField = "Catalog.ЗоныТарифыДоставки.StandardAttribute.Владелец"
    const result = exportMetadataFieldToYAML(mockContext, mockRule, metadataField)
    expect(result).toEqual("Справочник.ЗоныТарифыДоставки.СтандартныйРеквизит.Владелец")
  })

  it("rejects form-local data paths", () => {
    const metadataField = "Объект.Организация"
    expect(() => exportMetadataFieldToYAML(mockContext, mockRule, metadataField)).toThrow('Неизвестный корень "Объект"')
  })
})
