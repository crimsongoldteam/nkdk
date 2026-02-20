import {
  CharacteristicsDescription,
  CharacteristicsDescriptionYAML,
  CharacteristicsDescriptions,
  CharacteristicsDescriptionsYAML,
} from "~/metadata/commonObjects/characteristicsDescription/types"

export const singleSimple: CharacteristicsDescription = {
  characteristicTypes: "ChartOfCharacteristicTypes.РеквизитыДляСписка",
  keyField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.Ref",
  typesFilterField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.PredefinedDataName",
  typesFilterValue: { type: "string", value: "СегментыНоменклатуры" },
  multipleValuesUseField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.Attribute.Множественный",
}

export const singleSimpleYAML: CharacteristicsDescriptionYAML = {
  ВидыХарактеристик: "ПланВидовХарактеристик.РеквизитыДляСписка",
  ПолеКлюча: "ПланВидовХарактеристик.РеквизитыДляСписка.СтандартныйРеквизит.Ссылка",
  ПолеОтбораВидов: "ПланВидовХарактеристик.РеквизитыДляСписка.СтандартныйРеквизит.ИмяПредопределенныхДанных",
  ЗначениеОтбораВидов: '"СегментыНоменклатуры"',
  ПолеИспользованияМножественныхЗначений: "ПланВидовХарактеристик.РеквизитыДляСписка.Реквизит.Множественный",
}

export const multiple: CharacteristicsDescriptions = [
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

export const multipleYAML: CharacteristicsDescriptionsYAML = [
  {
    ВидыХарактеристик: "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеРеквизиты",
    ЗначенияХарактеристик: "Справочник.Номенклатура.ТабличнаяЧасть.ДополнительныеРеквизиты",
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
    ВидыХарактеристик: "Справочник.НаборыДополнительныхРеквизитовИСведений.ТабличнаяЧасть.ДополнительныеСведения",
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
