import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { SearchControlAddition } from "./types"
export type { ElementRule, PropertyRule }

export const SearchControlAdditionRules: ElementRule<SearchControlAddition> = {
  properties: {
    additionSource: { yaml: "Источник", type: "string" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    font: { yaml: "Шрифт", type: "Font" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
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
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
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
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    visible: { yaml: "Видимость", type: "boolean" },
    childItems: { yaml: "ПодчиненныеЭлементы", type: "FieldsList" },
  },
  events: {},
}

registerElementRule("SearchControlAddition", SearchControlAdditionRules)
