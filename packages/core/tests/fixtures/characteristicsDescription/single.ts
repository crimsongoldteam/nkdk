import { CharacteristicsDescriptions } from "~/metadata/commonObjects/characteristicsDescription/types"

export const singleCharacteristic: CharacteristicsDescriptions = [
  {
    characteristicTypes: "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеСведения",
    keyField:
      "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеСведения.Attribute.Свойство",
    typesFilterField:
      "Catalog.НаборыДополнительныхРеквизитовИСведений.TabularSection.ДополнительныеСведения.Attribute.ИмяПредопределенногоНабора",
    typesFilterValue: { type: "string", value: "Справочник_БанковскиеСчетаОрганизаций" },
    characteristicValues: "InformationRegister.ДополнительныеСведения",
    objectField: "InformationRegister.ДополнительныеСведения.Dimension.Объект",
    typeField: "InformationRegister.ДополнительныеСведения.Dimension.Свойство",
    valueField: "InformationRegister.ДополнительныеСведения.Resource.Значение",
  },
]

