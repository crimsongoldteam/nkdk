import { ElementRule, PropertyRule } from "../../../metadataFactory/elementRulesFactory"
import { ViewStatusAddition } from "./types"
export type { ElementRule, PropertyRule }

export const ViewStatusAdditionRules: ElementRule<ViewStatusAddition> = {
  enterpriseField: "ViewStatusAddition",
  properties: {
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    buttonsBackColor: { yaml: "ЦветФонаКнопок", type: "Color" },
    font: { yaml: "Шрифт", type: "Font" },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    titleFont: { yaml: "ШрифтЗаголовка", type: "Font" },
    titleTextColor: { yaml: "ЦветТекстаЗаголовка", type: "Color" },
    width: { yaml: "Ширина", type: "number" },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
  },
}
