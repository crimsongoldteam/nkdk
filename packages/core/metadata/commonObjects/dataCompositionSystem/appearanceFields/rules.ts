import { settingsParameterValueRule } from "../parameterValue/types"
import { MetadataItemRule, PropertyRule, registerTypeRule } from "../../../orchestration"
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

registerTypeRule("AppearanceFields", "yamlToXMLNestedRule", {
  kind: "item",
  itemRule: AppearanceFieldsRules,
  sparseYAML: true,
  transformOutput: ({ xml, propertyRule }) => {
    if ((propertyRule as AppearanceFieldsPropertyRule).appearanceXml === "dataSetField") {
      return Object.fromEntries(
        Object.entries(xml).flatMap(([name, value]) => {
          const tag = directAppearanceXmlTags[name as keyof typeof directAppearanceXmlTags]
          if (tag === undefined || value === null || typeof value !== "object" || Array.isArray(value)) return []
          const parameter = value as Record<string, unknown>
          return parameter["dcscor:value"] === undefined ? [] : [[tag, { "dcsset:value": parameter["dcscor:value"] }]]
        })
      )
    }

    return {
      "dcscor:item": Object.keys(AppearanceFieldsRules.properties).flatMap((name) => {
        const value = xml[name]
        return value !== null && typeof value === "object" && !Array.isArray(value)
          ? [value as Record<string, unknown>]
          : []
      }),
    }
  },
})
