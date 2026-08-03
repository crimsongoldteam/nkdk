import { settingsParameterValueRule } from "../parameterValue/types"
import { MetadataItemRule, PropertyRule, registerTypeRule } from "../../../orchestration"
import { normalizeAppearanceFieldsStringYAML } from "./stringValues"
export type AppearanceFieldsPropertyRule = PropertyRule & {
  type: "AppearanceFields"
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
registerTypeRule("AppearanceFields", "yamlToXMLNestedRule", {
  kind: "item",
  itemRule: AppearanceFieldsRules,
  sparseYAML: true,
  normalizeYAML: ({ yaml }) => normalizeAppearanceFieldsStringYAML(yaml),
  transformOutput: ({ xml }) => {
    const items = Object.keys(AppearanceFieldsRules.properties).flatMap((name) => {
      const value = xml[name]
      return value !== null && typeof value === "object" && !Array.isArray(value)
        ? [value as Record<string, unknown>]
        : []
    })
    return items.length === 0 ? {} : { "dcscor:item": items }
  },
})
registerTypeRule("AppearanceFields", "xmlImportPropertyBehavior", { presenceAffectsExport: true })
