import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { readXMLFileAsString } from "~/lib/tests/readAndParseXMLFile"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportCharacteristicsDescriptionsToXML } from "./exportToXML"
import { CharacteristicsDescriptions } from "./types"

describe("exportCharacteristicsDescriptionToXML", () => {
  it("should export single characteristic", () => {
    const mockData: CharacteristicsDescriptions = [
      {
        characteristicTypes: "ChartOfCharacteristicTypes.РеквизитыДляСписка",
        keyField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.Ref",
        typesFilterField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.PredefinedDataName",
        typesFilterValue: "СегментыНоменклатуры",
        multipleValuesUseField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.Attribute.Множественный",
      },
    ]

    const expectedXml = readXMLFileAsString("characteristicsDescription/simple.xml")

    const result = exportCharacteristicsDescriptionsToXML(mockСontext, mockData)
    const xmlString = xmlExport({ Characteristics: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })

  it("should export multiple characteristics", () => {
    const mockData: CharacteristicsDescriptions = [
      {
        characteristicTypes: "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеРеквизиты",
        characteristicValues: "Catalog.Номенклатура.TabularSection.ДополнительныеРеквизиты",
        keyField:
          "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеРеквизиты.Attribute.Свойство",
        typesFilterField:
          "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеРеквизиты.Attribute.ИмяПредопределенногоНабора",
        typesFilterValue: "Справочник_Номенклатура",
        objectField: "Catalog.Номенклатура.TabularSection.ДополнительныеРеквизиты.StandardAttribute.Ref",
        typeField: "Catalog.Номенклатура.TabularSection.ДополнительныеРеквизиты.Attribute.Свойство",
        valueField: "Catalog.Номенклатура.TabularSection.ДополнительныеРеквизиты.Attribute.Значение",
      },
      {
        characteristicTypes: "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеСведения",
        characteristicValues: "InformationRegister.ДополнительныеСведения",
        keyField:
          "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеСведения.Attribute.Свойство",
        typesFilterField:
          "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеСведения.Attribute.ИмяПредопределенногоНабора",
        typesFilterValue: "Справочник_Номенклатура",
        objectField: "InformationRegister.ДополнительныеСведения.Dimension.Объект",
        typeField: "InformationRegister.ДополнительныеСведения.Dimension.Свойство",
        valueField: "InformationRegister.ДополнительныеСведения.Resource.Значение",
      },
    ]

    const expectedXml = readXMLFileAsString("characteristicsDescription/multiple.xml")

    const result = exportCharacteristicsDescriptionsToXML(mockСontext, mockData)
    const xmlString = xmlExport({ Characteristics: result }, false)

    expect(xmlString).toEqual(expectedXml)
  })
})
