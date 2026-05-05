import { MetadataItemRule } from "~/metadata/orchestration"

export const AppearanceFieldsRules = {
  itemType: "AppearanceFields",
  properties: {
    ЦветФона: {
      type: "SettingsParameterValue",
      valueType: "Color",
      yaml: "ЦветФона",
    },
    ЦветТекста: {
      type: "SettingsParameterValue",
      valueType: "Color",
      yaml: "ЦветТекста",
    },
    Шрифт: {
      type: "SettingsParameterValue",
      valueType: "Font",
      yaml: "Шрифт",
    },
    ГоризонтальноеПоложение: {
      type: "SettingsParameterValue",
      valueType: "SystemEnumeration",
      typeSE: "HorizontalAlign",
      yaml: "ГоризонтальноеПоложение",
    },
    Формат: {
      type: "SettingsParameterValue",
      valueType: "DesignTimeValue",
      yaml: "Формат",
    },
    ВыделятьОтрицательные: {
      type: "SettingsParameterValue",
      valueType: "Primitive",
      yaml: "ВыделятьОтрицательные",
    },
    ОтметкаНезаполненного: {
      type: "SettingsParameterValue",
      valueType: "Primitive",
      yaml: "ОтметкаНезаполненного",
    },
    Текст: {
      type: "SettingsParameterValue",
      valueType: "DesignTimeValue",
      yaml: "Текст",
    },
    Видимость: {
      type: "SettingsParameterValue",
      valueType: "Primitive",
      yaml: "Видимость",
    },
    Доступность: {
      type: "SettingsParameterValue",
      valueType: "Primitive",
      yaml: "Доступность",
    },
    ТолькоПросмотр: {
      type: "SettingsParameterValue",
      valueType: "Primitive",
      yaml: "ТолькоПросмотр",
    },
    Отображать: {
      type: "SettingsParameterValue",
      valueType: "Primitive",
      yaml: "Отображать",
    },
  },
} as const satisfies MetadataItemRule
