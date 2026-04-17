import { CharacteristicsDescriptions } from "../types"

export const singleCharacteristic: CharacteristicsDescriptions = [
  {
    itemType: "CharacteristicsDescription",
    characteristicTypes: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    keyField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    characteristicValues: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    objectField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    typeField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
  },
]

export const multipleCharacteristics: CharacteristicsDescriptions = [
  {
    itemType: "CharacteristicsDescription",
    characteristicTypes: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    keyField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    characteristicValues: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    objectField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    typeField: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
  },
  {
    itemType: "CharacteristicsDescription",
    characteristicTypes: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
    keyField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    typesFilterField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Description",
    typesFilterValue: { type: "string", value: "Текст" },
    dataPathField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    multipleValuesUseField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.Attribute.МножественнаяХарактеристика",
    characteristicValues: "InformationRegister.ЗначенияХарактеристикОбъектов",
    objectField: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.Справочник",
    typeField: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.Характеристика",
    valueField: "InformationRegister.ЗначенияХарактеристикОбъектов.Resource.Значение",
    multipleValuesKeyField: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.КлючУникальности",
    multipleValuesOrderField: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.Характеристика",
  },
]
