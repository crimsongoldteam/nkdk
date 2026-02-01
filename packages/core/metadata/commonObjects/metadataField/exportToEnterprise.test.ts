import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportMetadataFieldToEnterprise } from "./exportToEnterprise"

describe("exportMetadataFieldToEnterprise", () => {
  it("should export metadata field to enterprise", () => {
    const metadataField =
      "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект"
    const result = exportMetadataFieldToEnterprise(mockContext, metadataField)
    expect(result).toEqual(
      "Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект"
    )
  })

  it("should export metadata field to enterprise with tabular section", () => {
    const metadataField =
      "Catalog.АвтоматическиеСкидки.TabularSection.НоменклатураГруппыЦеновыеГруппы.Attribute.ЗначениеУточнения"
    const result = exportMetadataFieldToEnterprise(mockContext, metadataField)
    expect(result).toEqual(
      "Справочник.АвтоматическиеСкидки.ТабличнаяЧасть.НоменклатураГруппыЦеновыеГруппы.Реквизит.ЗначениеУточнения"
    )
  })

  it("should export with standart attribute", () => {
    const metadataField = "Catalog.ЗоныТарифыДоставки.StandardAttribute.Owner"
    const result = exportMetadataFieldToEnterprise(mockContext, metadataField)
    expect(result).toEqual("Справочник.ЗоныТарифыДоставки.СтандартныйРеквизит.Владелец")
  })

  it("should export with form object", () => {
    const metadataField = "Объект.Организация"
    const result = exportMetadataFieldToEnterprise(mockContext, metadataField)
    expect(result).toEqual("Объект.Организация")
  })
})
