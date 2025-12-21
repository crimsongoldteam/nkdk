import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { readAndParseXMLFile } from "~/lib/tests/readAndParseXMLFile"
import { importCharacteristicsDescriptionFromXML, importCharacteristicsDescriptionsFromXML } from "./importFromXML"
import { CharacteristicsDescription, CharacteristicsDescriptionXML } from "./types"

describe("importCharacteristicsDescriptionFromXML", () => {
  it("should import single characteristic", () => {
    const xmlData = readAndParseXMLFile<{ "xr:Characteristic": CharacteristicsDescriptionXML }>(
      "characteristicsDescription/simple.xml"
    )

    const expectedResult: CharacteristicsDescription = {
      characteristicTypes: "ChartOfCharacteristicTypes.РеквизитыДляСписка",
      keyField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.Ref",
      typesFilterField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.PredefinedDataName",
      typesFilterValue: "СегментыНоменклатуры",
      multipleValuesUseField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.Attribute.Множественный",
    }
    const result = importCharacteristicsDescriptionFromXML(xmlData["xr:Characteristic"], mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
  it("should import characteristic with both types and values", () => {
    const xmlData = readAndParseXMLFile<{ "xr:Characteristic": CharacteristicsDescriptionXML }>(
      "characteristicsDescription/multiple.xml"
    )

    // Берем первый элемент из массива
    const firstCharacteristic = Array.isArray(xmlData["xr:Characteristic"])
      ? xmlData["xr:Characteristic"][0]
      : xmlData["xr:Characteristic"]

    const expectedResult: CharacteristicsDescription = {
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
    }
    const result = importCharacteristicsDescriptionFromXML(firstCharacteristic, mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
})

describe("importCharacteristicsDescriptionsFromXML", () => {
  it("should import multiple characteristics", () => {
    const xmlData = readAndParseXMLFile<{ "xr:Characteristic": CharacteristicsDescriptionXML[] }>(
      "characteristicsDescription/multiple.xml"
    )

    const expectedResult: CharacteristicsDescription[] = [
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
    const result = importCharacteristicsDescriptionsFromXML(xmlData["xr:Characteristic"], mockConfigurationSettings)
    expect(result).toEqual(expectedResult)
  })
})
