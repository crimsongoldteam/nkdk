import { FormAttributes, FormAttributesEnterprise } from "~/metadata/commonObjects/formAttribute/types"

//#region FullFormAttributes

export const fullFormAttributes: FormAttributes = [
  {
    name: "Объект",
    title: { items: { ru: "" } },
    valueType: {
      type: ["decimal"],
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
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Заголовок атрибута" } },
    valueType: {
      type: ["string"],
    },
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
  Объект: {
    Тип: "Число",
    ОсновнойРеквизит: "Истина",
    СохраняемыеДанные: "Истина",
    РазрешитьИспользование: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
  },
  ТестовыйАтрибут: {
    Заголовок: "Заголовок атрибута",
    Тип: "Строка",
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
    valueType: {
      type: ["string"],
    },
    title: { items: { ru: "" } },
  },
]

//#endregion

//#region Multiple

export const multipleFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут1",
    title: { items: { ru: "Атрибут 1" } },
    valueType: {
      type: ["string"],
    },
  },
  {
    name: "ТестовыйАтрибут2",
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
    title: { items: { ru: "Тестовый атрибут" } },
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
    Заголовок: "",
    Тип: "Строка",
  },
}
//#endregion

//#region WithMainAttribute
export const withMainAttributeFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    mainAttribute: true,
  },
]
//#endregion

//#region MainAttributeWithTitleEqualsName

export const mainAttributeTitleEqualsName: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
    },
    mainAttribute: true,
  },
]

export const mainAttributeTitleEqualsNameEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: {
    Заголовок: "Тестовый атрибут",
    Тип: "Строка",
    ОсновнойРеквизит: "Истина",
  },
}
//#endregion

//#region WithStoredData
export const withStoredDataFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    storedData: true,
  },
]
//#endregion

//#region ChoiceList
export const choiceListFormAttribute: FormAttributes = [
  {
    settings: {
      type: ["CatalogRef.ДоговорыКонтрагентов"],
    },
    name: "ВыбранныеЗначения",
    title: { items: { ru: "Выбранные значения" } },
    valueType: {
      type: ["ValueListType"],
    },
  },
]

export const choiceListFormAttributeEnterprise: FormAttributesEnterprise = {
  ВыбранныеЗначения: {
    Тип: "СписокЗначений",
    ТипЗначения: "Справочник.ДоговорыКонтрагентов",
  },
}

//#endregion

//#region WithEmptySettings

export const withEmptySettingsFormAttribute: FormAttributes = [
  {
    name: "ВыбранныеЗначения",
    title: { items: { ru: "Выбранные значения" } },
    valueType: { type: ["ValueListType"] },
  },
]

export const withEmptySettingsFormAttributeEnterprise: FormAttributesEnterprise = {
  ВыбранныеЗначения: "СписокЗначений",
}
//#endregion
