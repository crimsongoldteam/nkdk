import { CharacteristicsDescriptions, CharacteristicsDescriptionsYAML } from "../types"
import { explicitYAMLString } from "@nkdk/runtime"

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
    ВидыХарактеристик: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
    ПолеКлюча: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
    ЗначенияХарактеристик: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
    ПолеОбъекта: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
    ПолеВида: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
  },
]

export const multipleCharacteristicsYAML: CharacteristicsDescriptionsYAML = [
  {
    ВидыХарактеристик: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
    ПолеКлюча: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
    ЗначенияХарактеристик: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть",
    ПолеОбъекта: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
    ПолеВида: "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.СтандартныйРеквизит.Ссылка",
  },
  {
    ВидыХарактеристик: "ПланВидовХарактеристик.ХарактеристикиОбъектов",
    ПолеКлюча: "ПланВидовХарактеристик.ХарактеристикиОбъектов.СтандартныйРеквизит.Ссылка",
    ПолеОтбораВидов: "ПланВидовХарактеристик.ХарактеристикиОбъектов.СтандартныйРеквизит.Наименование",
    ЗначениеОтбораВидов: explicitYAMLString("Текст"),
    ПолеПутиКДанным: "ПланВидовХарактеристик.ХарактеристикиОбъектов.СтандартныйРеквизит.Ссылка",
    ПолеИспользованияМножественныхЗначений:
      "ПланВидовХарактеристик.ХарактеристикиОбъектов.Реквизит.МножественнаяХарактеристика",
    ЗначенияХарактеристик: "РегистрСведений.ЗначенияХарактеристикОбъектов",
    ПолеОбъекта: "РегистрСведений.ЗначенияХарактеристикОбъектов.Измерение.Справочник",
    ПолеВида: "РегистрСведений.ЗначенияХарактеристикОбъектов.Измерение.Характеристика",
    ПолеЗначения: "РегистрСведений.ЗначенияХарактеристикОбъектов.Ресурс.Значение",
    ПолеКлючаМножественныхЗначений: "РегистрСведений.ЗначенияХарактеристикОбъектов.Измерение.КлючУникальности",
    ПолеПорядкаМножественныхЗначений: "РегистрСведений.ЗначенияХарактеристикОбъектов.Измерение.Характеристика",
  },
  {
    ВидыХарактеристик: "ПланВидовХарактеристик.ДолжностиПодключаемыеХарактеристики",
    ПолеКлюча: "ПланВидовХарактеристик.ДолжностиПодключаемыеХарактеристики.СтандартныйРеквизит.Ссылка",
    ПолеОтбораВидов: "ПланВидовХарактеристик.ДолжностиПодключаемыеХарактеристики.Реквизит.Используется",
    ЗначениеОтбораВидов: "Истина",
    ЗначенияХарактеристик: "РегистрСведений.ДолжностиПодключаемыеХарактеристики",
    ПолеОбъекта: "РегистрСведений.ДолжностиПодключаемыеХарактеристики.Измерение.Объект",
    ПолеВида: "РегистрСведений.ДолжностиПодключаемыеХарактеристики.Измерение.Свойство",
    ПолеЗначения: "РегистрСведений.ДолжностиПодключаемыеХарактеристики.Ресурс.Значение",
  },
]
