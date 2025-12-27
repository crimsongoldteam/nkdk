import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { importMetadataFieldFromEnterprise } from "./importFromEnterprise"

describe("importMetadataFieldFromEnterprise", () => {
  it("should import metadata field from enterprise", () => {
    const enterprise =
      "Справочник.ВетеринарноСопроводительныйДокументВЕТИС.Реквизит.ГрузоотправительХозяйствующийСубъект"
    const result = importMetadataFieldFromEnterprise(mockСontext, enterprise)
    expect(result).toEqual(
      "Catalog.ВетеринарноСопроводительныйДокументВЕТИС.Attribute.ГрузоотправительХозяйствующийСубъект"
    )
  })

  it("should import metadata field from enterprise with tabular section", () => {
    const enterprise =
      "Справочник.АвтоматическиеСкидки.ТабличнаяЧасть.НоменклатураГруппыЦеновыеГруппы.Реквизит.ЗначениеУточнения"
    const result = importMetadataFieldFromEnterprise(mockСontext, enterprise)
    expect(result).toEqual(
      "Catalog.АвтоматическиеСкидки.TabularSection.НоменклатураГруппыЦеновыеГруппы.Attribute.ЗначениеУточнения"
    )
  })

  it("should import with standard attribute", () => {
    const enterprise = "Справочник.ЗоныТарифыДоставки.СтандартныйРеквизит.Владелец"
    const result = importMetadataFieldFromEnterprise(mockСontext, enterprise)
    expect(result).toEqual("Catalog.ЗоныТарифыДоставки.StandardAttribute.Owner")
  })

  it("should import with form object", () => {
    const enterprise = "Объект.Организация"
    const result = importMetadataFieldFromEnterprise(mockСontext, enterprise)
    expect(result).toEqual("Объект.Организация")
  })
})
