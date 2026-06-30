import { settingsParameterValueRule } from "~/metadata/commonObjects/dataCompositionSystem/parameterValue/types"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration"
export type AppearanceFieldsXMLMode = "dataSetField"
export type AppearanceFieldsPropertyRule = PropertyRule & {
  type: "AppearanceFields"
  appearanceXml?: AppearanceFieldsXMLMode
}
export const AppearanceFieldsRules = {
  itemType: "AppearanceFields",
  properties: {
    ЦветФона: settingsParameterValueRule({
      valueType: "Color",
      yaml: "ЦветФона",
    }),
    ЦветТекста: settingsParameterValueRule({
      valueType: "Color",
      yaml: "ЦветТекста",
    }),
    Шрифт: settingsParameterValueRule({
      valueType: "Font",
      yaml: "Шрифт",
    }),
    ГоризонтальноеПоложение: settingsParameterValueRule({
      valueType: "SystemEnumeration",
      typeSE: "HorizontalAlign",
      yaml: "ГоризонтальноеПоложение",
    }),
    Формат: settingsParameterValueRule({
      valueType: "DesignTimeValue",
      yaml: "Формат",
    }),
    ВыделятьОтрицательные: settingsParameterValueRule({
      valueType: "Primitive",
      yaml: "ВыделятьОтрицательные",
    }),
    ОтметкаНезаполненного: settingsParameterValueRule({
      valueType: "Primitive",
      yaml: "ОтметкаНезаполненного",
    }),
    Текст: settingsParameterValueRule({
      valueType: "DesignTimeValue",
      yaml: "Текст",
    }),
    Видимость: settingsParameterValueRule({
      valueType: "Primitive",
      yaml: "Видимость",
    }),
    Доступность: settingsParameterValueRule({
      valueType: "Primitive",
      yaml: "Доступность",
    }),
    ТолькоПросмотр: settingsParameterValueRule({
      valueType: "Primitive",
      yaml: "ТолькоПросмотр",
    }),
    Отображать: settingsParameterValueRule({
      valueType: "Primitive",
      yaml: "Отображать",
    }),
  },
} as const satisfies MetadataItemRule
export const directAppearanceXmlTags = {
  ЦветФона: "dcsset:backColor",
  ЦветТекста: "dcsset:textColor",
  Шрифт: "dcsset:font",
  ГоризонтальноеПоложение: "dcsset:horizontalAlign",
  Формат: "dcsset:format",
  ВыделятьОтрицательные: "dcsset:markNegatives",
  ОтметкаНезаполненного: "dcsset:markIncomplete",
  Текст: "dcsset:text",
  Видимость: "dcsset:visible",
  Доступность: "dcsset:enabled",
  ТолькоПросмотр: "dcsset:readOnly",
  Отображать: "dcsset:show",
} as const satisfies Record<keyof typeof AppearanceFieldsRules.properties, `dcsset:${string}`>
export type DirectAppearanceXMLTag = (typeof directAppearanceXmlTags)[keyof typeof directAppearanceXmlTags]
