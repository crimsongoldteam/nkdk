import { CharacteristicsDescriptions } from "~/metadata/commonObjects/characteristicsDescription/types"

export const multipleCharacteristics: CharacteristicsDescriptions = [
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

