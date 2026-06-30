import { tableAdditionalSourceRule } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { getSearchStringAdditionName } from "./helper"
export type { ElementRule, PropertyRule }
const commonProperties = {
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
  backColor: {
    yaml: "ЦветФона",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  borderColor: {
    yaml: "ЦветРамки",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  font: {
    yaml: "Шрифт",
    type: "Font",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
  },
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", noImplicitValueYAML: true },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
  textColor: {
    yaml: "ЦветТекста",
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
  extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
  },
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
  userVisible: {
    yaml: "Использование",
    type: "UserVisible",
  },
  verticalAlignInGroup: {
    yaml: "ВертикальноеПоложениеВГруппе",
    xml: "GroupVerticalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    implicitValueYAML: "Auto",
  },
  visible: { yaml: "Видимость", type: "boolean", noImplicitValueYAML: true },
} as const satisfies MetadataItemRule["properties"]
export const SingleSearchStringAdditionRules = {
  itemType: "SingleSearchStringAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    additionSource: tableAdditionalSourceRule({
      additionalSourceType: "SearchStringRepresentation",
      fromXML: false,
      forSingleElement: true,
    }),
    ...commonProperties,
  },
} as const satisfies ElementRule
export const SearchStringAdditionRules = {
  itemType: "SearchStringAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    additionSource: tableAdditionalSourceRule({
      yaml: "Источник",
      additionalSourceType: "SearchStringRepresentation",
    }),
    ...commonProperties,
  },
} as const satisfies ElementRule
registerElementAsType({
  propertyType: "SingleSearchStringAddition",
  elementRule: SingleSearchStringAdditionRules,
  nameStyle: {
    canonicalSuffix: "СтрокаПоиска",
    referenceSuffixes: ["СтрокаПоиска", "SearchString"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    if (!context.exportToXML.itemsTree) throw new Error("elementContext is not defined")
    const parent = getParentFromContext(context, ["Table"])
    const name = getSearchStringAdditionName(parent)
    return { name }
  },
})
registerElementRule("SearchStringAddition", SearchStringAdditionRules)
registerElementRule("SingleSearchStringAddition", SingleSearchStringAdditionRules)
