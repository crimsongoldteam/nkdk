import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import {
  exportCharacteristicsDescriptionToEnterprise,
  exportCharacteristicsDescriptionsToEnterprise,
} from "./exportToEnterprise"
import { CharacteristicsDescription, CharacteristicsDescriptionEnterprise, CharacteristicsDescriptions } from "./types"

describe("exportCharacteristicsDescriptionToEnterprise", () => {
  it("should export single characteristic", () => {
    const mockData: CharacteristicsDescription = {
      characteristicTypes: "ChartOfCharacteristicTypes.РеквизитыДляСписка",
      keyField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.Ref",
      typesFilterField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.PredefinedDataName",
      typesFilterValue: { type: "string", value: "СегментыНоменклатуры" },
      multipleValuesUseField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.Attribute.Множественный",
    }

    const expectedResult: CharacteristicsDescriptionEnterprise = {
      ВидыХарактеристик: "ПланВидовХарактеристик.РеквизитыДляСписка",
      ПолеКлюча: "ПланВидовХарактеристик.РеквизитыДляСписка.СтандартныйРеквизит.Ссылка",
      ПолеОтбораВидов: "ПланВидовХарактеристик.РеквизитыДляСписка.СтандартныйРеквизит.ИмяПредопределенныхДанных",
      ЗначениеОтбораВидов: '"СегментыНоменклатуры"',
      ПолеИспользованияМножественныхЗначений: "ПланВидовХарактеристик.РеквизитыДляСписка.Реквизит.Множественный",
    }

    const result = exportCharacteristicsDescriptionToEnterprise(mockСontext, mockData)

    expect(result).toEqual(expectedResult)
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
        typesFilterValue: { type: "string", value: "Справочник_Номенклатура" },
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
        typesFilterValue: { type: "string", value: "Справочник_Номенклатура" },
        objectField: "InformationRegister.ДополнительныеСведения.Dimension.Объект",
        typeField: "InformationRegister.ДополнительныеСведения.Dimension.Свойство",
        valueField: "InformationRegister.ДополнительныеСведения.Resource.Значение",
      },
    ]

    const expectedResult: CharacteristicsDescriptionEnterprise[] = [
      {
        ВидыХарактеристик: "Справочник.НаборыДополнительныхРеквизитовИСведений",
        ЗначенияХарактеристик: "Справочник.Номенклатура",
        ПолеКлюча:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.Свойство",
        ПолеОтбораВидов:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.ИмяПредопределенногоНабора",
        ЗначениеОтбораВидов: '"Справочник_Номенклатура"',
        ПолеОбъекта: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты.СтандартныйРеквизит.Ссылка",
        ПолеВида: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.Свойство",
        ПолеЗначения: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты.Реквизит.Значение",
      },
      {
        ВидыХарактеристик: "Справочник.НаборыДополнительныхРеквизитовИСведений",
        ЗначенияХарактеристик: "РегистрСведений.ДополнительныеСведения",
        ПолеКлюча:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеСведения.Реквизит.Свойство",
        ПолеОтбораВидов:
          "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеСведения.Реквизит.ИмяПредопределенногоНабора",
        ЗначениеОтбораВидов: '"Справочник_Номенклатура"',
        ПолеОбъекта: "РегистрСведений.ДополнительныеСведения.Измерение.Объект",
        ПолеВида: "РегистрСведений.ДополнительныеСведения.Измерение.Свойство",
        ПолеЗначения: "РегистрСведений.ДополнительныеСведения.Ресурс.Значение",
      },
    ]

    const result = exportCharacteristicsDescriptionsToEnterprise(mockСontext, mockData)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportCharacteristicsDescriptionToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined for undefined array input", () => {
    const result = exportCharacteristicsDescriptionsToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })
})
