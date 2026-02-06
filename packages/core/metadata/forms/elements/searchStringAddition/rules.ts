import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { SearchStringAddition } from "./types"
export type { ElementRule, PropertyRule }

export const SearchStringAdditionRules: ElementRule<SearchStringAddition> = {
  properties: {
    additionSource: { yaml: "Источник", type: "string" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    font: { yaml: "Шрифт", type: "Font" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
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
  },
  events: {},
}

registerElementRule("SearchStringAddition", SearchStringAdditionRules)
