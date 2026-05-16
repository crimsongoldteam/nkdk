import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { getViewStatusAdditionName } from "./helper"
export type { ElementRule, PropertyRule }

const commonProperties = {
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
} as const satisfies MetadataItemRule["properties"]

export const SingleViewStatusAdditionRules = {
  itemType: "SingleViewStatusAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "ViewStatusRepresentation",
      fromXML: false,
      forSingleElement: true,
    },
    ...commonProperties,
  },
} as const satisfies ElementRule

export const ViewStatusAdditionRules = {
  itemType: "ViewStatusAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    name: { type: "string", xml: "_name", required: true },
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "ViewStatusRepresentation",
    },
    ...commonProperties,
    contextMenu: {
      yaml: "КонтекстноеМеню",
      type: "ContextMenu",
      defaultValueXMLEmpty: { itemType: "ContextMenu", childItems: [] },
    },
    extendedTooltip: {
      yaml: "РасширеннаяПодсказка",
      type: "ExtendedTooltip",
      defaultValueXMLEmpty: { itemType: "ExtendedTooltip" },
    },
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "SingleViewStatusAddition",
  elementRule: SingleViewStatusAdditionRules,
  nameStyle: {
    canonicalSuffix: "СостояниеПросмотра",
    referenceSuffixes: ["СостояниеПросмотра", "ViewStatus"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context, ["Table", "PDFDocumentField"])
    const name = getViewStatusAdditionName(parent)
    return { name }
  },
})

registerElementRule("ViewStatusAddition", ViewStatusAdditionRules)
registerElementRule("SingleViewStatusAddition", SingleViewStatusAdditionRules)
