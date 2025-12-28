import {
  MetadataAttribute,
  MetadataAttributeEnterprise,
  MetadataAttributesEnterprise,
} from "~/metadata/commonObjects/metadataAttribute/types"

export const fullMetadataAttribute: MetadataAttribute = {
  name: "ТестовыйРеквизит",
  synonym: { items: { ru: "Какой-то тестовый реквизит" } },
  type: { type: ["string"] },
}

export const fullMetadataAttributeEnterprise: MetadataAttributeEnterprise = {
  Тип: "Строка",
  Синоним: "Какой-то тестовый реквизит",
}

export const shortMetadataAttribute: MetadataAttribute = {
  name: "ТестовыйРеквизит",
  type: { type: ["string"] },
}

export const shortMetadataAttributeEnterprise: MetadataAttributeEnterprise = "Строка"

export const shortMetadataAttributeWithSynonym: MetadataAttribute = {
  name: "ТестовыйРеквизит",
  synonym: { items: { ru: "Тестовый реквизит" } },
  type: { type: ["string"] },
}

export const singleAttributesEnterprise: MetadataAttributesEnterprise = {
  РеквизитОбъекта: {
    Тип: "Строка",
    Синоним: "Реквизит какого-то объекта",
    МаксимальноеЗначение: 3,
    МинимальноеЗначение: 1,
    ЗначениеЗаполнения: "Перечисление.ТипыНоменклатуры.Товар",
  },
}
