import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importCharacteristicsDescriptionsFromXML } from "./importFromXML"
import { CharacteristicsDescriptions, CharacteristicsDescriptionsXML } from "./types"

describe("importCharacteristicsDescriptionFromXML", () => {
  it("should import single characteristic", () => {
    const xmlData = readAndParseXMLFile<{ Characteristics: CharacteristicsDescriptionsXML }>(
      "characteristicsDescription/simple.xml"
    )

    const expectedResult: CharacteristicsDescriptions = [
      {
        characteristicTypes: "ChartOfCharacteristicTypes.РеквизитыДляСписка",
        keyField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.Ref",
        typesFilterField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.PredefinedDataName",
        typesFilterValue: "СегментыНоменклатуры",
        multipleValuesUseField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.Attribute.Множественный",
      },
    ]
    const result = importCharacteristicsDescriptionsFromXML(mockСontext, xmlData.Characteristics)
    expect(result).toEqual(expectedResult)
  })

  it("should import multiple characteristics", () => {
    const xmlData = readAndParseXMLFile<{ Characteristics: CharacteristicsDescriptionsXML }>(
      "characteristicsDescription/multiple.xml"
    )

    const expectedResult: CharacteristicsDescriptions = [
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
    const result = importCharacteristicsDescriptionsFromXML(mockСontext, xmlData.Characteristics)
    expect(result).toEqual(expectedResult)
  })
})
