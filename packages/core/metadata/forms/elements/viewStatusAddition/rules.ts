import { stringRule } from "~/metadata/commonObjects/string/types"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { getViewStatusAdditionName } from "./helper"
export type { ElementRule, PropertyRule }
const commonProperties = {
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
  backColor: {
    yaml: "ЦветФона",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  border: {
    yaml: "Рамка",
    type: "Border",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] },
  },
  borderColor: {
    yaml: "ЦветРамки",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  buttonsBackColor: {
    yaml: "ЦветФонаКнопок",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    xml: "ButtonColor",
  },
  font: {
    yaml: "Шрифт",
    type: "Font",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
  },
  horizontalAlign: {
    yaml: "ГоризонтальноеПоложение",
    xml: "HorizontalLocation",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
  },
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", noImplicitValueYAML: true },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
  textColor: {
    yaml: "ЦветТекста",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  titleFont: {
    yaml: "ШрифтЗаголовка",
    type: "Font",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
  },
  titleTextColor: {
    yaml: "ЦветТекстаЗаголовка",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  width: { yaml: "Ширина", type: "number", implicitValueYAML: 0 },
  contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
  displayImportance: {
    yaml: "ВажностьПриОтображении",
    xml: "_DisplayImportance",
    type: "SystemEnumeration",
    typeSE: "DisplayImportance",
    implicitValueYAML: "Auto",
  },
  enabled: { yaml: "Доступность", type: "boolean", implicitValueYAML: true },
  visible: { yaml: "Видимость", type: "boolean", noImplicitValueYAML: true },
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
    implicitValueYAML: "Auto",
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
    name: stringRule({ xml: "_name", required: true }),
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
