import { FormAttributes, FormAttributesEnterprise } from "~/metadata/commonObjects/formAttributes/types"

//#region FullFormAttributes
export const fullFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    id: "1",
    title: { items: { ru: "Заголовок атрибута" } },
    valueType: {
      type: ["string"],
    },
    mainAttribute: true,
    storedData: true,
    use: {
      common: true,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    },
  },
]

export const fullFormAttributesEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: {
    Заголовок: "Заголовок атрибута",
    Тип: "Строка",
    ОсновнойРеквизит: "Истина",
    СохраняемыеДанные: "Истина",
    РазрешитьИспользование: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
  },
}
//#endregion

//#region Minimal
export const minimalFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    id: "1",
    valueType: {
      type: ["string"],
    },
  },
]
//#endregion

//#region Multiple
export const multipleFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут1",
    id: "1",
    title: { items: { ru: "Атрибут 1" } },
    valueType: {
      type: ["string"],
    },
  },
  {
    name: "ТестовыйАтрибут2",
    id: "2",
    title: { items: { ru: "Атрибут 2" } },
    valueType: {
      type: ["string"],
    },
  },
]
//#endregion

//#region Short
export const shortFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    id: "1",
    valueType: {
      type: ["string"],
    },
  },
]

export const shortFormAttributeEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: "Строка",
}
//#endregion

//#region MinimalEnterprise
export const minimalFormAttributesEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: {
    Тип: "Строка",
  },
}
//#endregion

//#region WithMainAttribute
export const withMainAttributeFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    id: "1",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    mainAttribute: true,
  },
]
//#endregion

//#region WithStoredData
export const withStoredDataFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    id: "1",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    storedData: true,
  },
]
//#endregion
