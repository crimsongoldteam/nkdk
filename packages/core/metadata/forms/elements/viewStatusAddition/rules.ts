import { getParentFromContext } from "~/metadata/context/helpers"
import { getElementId } from "~/metadata/helpers/getElementId"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { getViewStatusAdditionName } from "./helper"
import { ViewStatusAddition } from "./types"
export type { ElementRule, PropertyRule }

// В YAML этот элемент может быть только в свойствах, не может быть в структуре

export const ViewStatusAdditionRules: ElementRule<ViewStatusAddition, "additionSource"> = {
  enterpriseFieldType: "None",
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "ViewStatusRepresentation",
      fromXML: false,
      forSingleElement: true,
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
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
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
        if (!context.elementsTree) throw new Error("elementContext is not defined")
        const parent = getParentFromContext(context, CollectionFormElementType.Table)
        const id = getElementId(context)
        const name = getViewStatusAdditionName(parent)
        return { name, id }
      },
    },
  },
}

registerElementRule("ViewStatusAddition", ViewStatusAdditionRules)
