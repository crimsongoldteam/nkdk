import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { getViewStatusAdditionName } from "./helper"
import { ViewStatusAddition } from "./types"
export type { ElementRule, PropertyRule }

export const ViewStatusAdditionRules: ElementRule<ViewStatusAddition, "additionSource"> = {
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "ViewStatusRepresentation",
    },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    backColor: { yaml: "ЦветФона", type: "Color" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    buttonsBackColor: { yaml: "ЦветФонаКнопок", type: "Color", xml: "ButtonColor" },
    font: { yaml: "Шрифт", type: "Font" },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      xml: "HorizontalLocation",
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
    },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
  },

  registerAsType: {
    ViewStatusAddition: {
      toXML: (context, _element) => {
        if (!context.elementContext) throw new Error("elementContext is not defined")
        const parent = context.elementContext
        const id = getElementId(context)
        const name = getViewStatusAdditionName(parent)
        return { name, id }
      },
    },
  },
}

registerElementRule("ViewStatusAddition", ViewStatusAdditionRules)
