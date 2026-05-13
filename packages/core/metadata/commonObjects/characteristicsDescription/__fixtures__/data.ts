import { CharacteristicsDescriptions, CharacteristicsDescriptionsYAML } from "../types"

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
  {
    itemType: "CharacteristicsDescription",
    characteristicTypes: "ChartOfCharacteristicTypes.ДолжностиПодключаемыеХарактеристики",
    keyField: "ChartOfCharacteristicTypes.ДолжностиПодключаемыеХарактеристики.StandardAttribute.Ref",
    typesFilterField: "ChartOfCharacteristicTypes.ДолжностиПодключаемыеХарактеристики.Attribute.Используется",
    typesFilterValue: { type: "boolean", value: true },
    characteristicValues: "InformationRegister.ДолжностиПодключаемыеХарактеристики",
    objectField: "InformationRegister.ДолжностиПодключаемыеХарактеристики.Dimension.Объект",
    typeField: "InformationRegister.ДолжностиПодключаемыеХарактеристики.Dimension.Свойство",
    valueField: "InformationRegister.ДолжностиПодключаемыеХарактеристики.Resource.Значение",
  },
]

export const singleCharacteristicYAML: CharacteristicsDescriptionsYAML = [
  {
    ВидыХарактеристик: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    ПолеКлюча: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    ЗначенияХарактеристик: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    ПолеОбъекта: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    ПолеВида: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
  },
]

export const multipleCharacteristicsYAML: CharacteristicsDescriptionsYAML = [
  {
    ВидыХарактеристик: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    ПолеКлюча: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    ЗначенияХарактеристик: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть",
    ПолеОбъекта: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
    ПолеВида: "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.StandardAttribute.Ref",
  },
  {
    ВидыХарактеристик: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
    ПолеКлюча: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    ПолеОтбораВидов: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Description",
    ЗначениеОтбораВидов: '"Текст"',
    ПолеПутиКДанным: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    ПолеИспользованияМножественныхЗначений: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.Attribute.МножественнаяХарактеристика",
    ЗначенияХарактеристик: "InformationRegister.ЗначенияХарактеристикОбъектов",
    ПолеОбъекта: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.Справочник",
    ПолеВида: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.Характеристика",
    ПолеЗначения: "InformationRegister.ЗначенияХарактеристикОбъектов.Resource.Значение",
    ПолеКлючаМножественныхЗначений: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.КлючУникальности",
    ПолеПорядкаМножественныхЗначений: "InformationRegister.ЗначенияХарактеристикОбъектов.Dimension.Характеристика",
  },
  {
    ВидыХарактеристик: "ChartOfCharacteristicTypes.ДолжностиПодключаемыеХарактеристики",
    ПолеКлюча: "ChartOfCharacteristicTypes.ДолжностиПодключаемыеХарактеристики.StandardAttribute.Ref",
    ПолеОтбораВидов: "ChartOfCharacteristicTypes.ДолжностиПодключаемыеХарактеристики.Attribute.Используется",
    ЗначениеОтбораВидов: "Истина",
    ЗначенияХарактеристик: "InformationRegister.ДолжностиПодключаемыеХарактеристики",
    ПолеОбъекта: "InformationRegister.ДолжностиПодключаемыеХарактеристики.Dimension.Объект",
    ПолеВида: "InformationRegister.ДолжностиПодключаемыеХарактеристики.Dimension.Свойство",
    ПолеЗначения: "InformationRegister.ДолжностиПодключаемыеХарактеристики.Resource.Значение",
  },
]
