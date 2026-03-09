import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { getSearchControlAdditionName } from "./helper"
export type { ElementRule, PropertyRule }

const commonProperties = {
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
  backColor: { yaml: "ЦветФона", type: "Color" },
  borderColor: { yaml: "ЦветРамки", type: "Color" },
  childItems: {
    yaml: "Элементы",
    type: "CommandBarChildItems",
    defaultValue: [],
    required: true,
  },
  contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
  displayImportance: {
    yaml: "ВажностьПриОтображении",
    xml: "_DisplayImportance",
    type: "SystemEnumeration",
    typeSE: "DisplayImportance",
  },
  enabled: { yaml: "Доступность", type: "boolean" },
  extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
  font: { yaml: "Шрифт", type: "Font" },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
  },
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
  textColor: { yaml: "ЦветТекста", type: "Color" },
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
  width: { yaml: "Ширина", type: "number" },
} as const satisfies MetadataItemRule["properties"]

export const SingleSearchControlAdditionRules = {
  itemType: "SingleSearchControlAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "SearchControl",
      fromXML: false,
      forSingleElement: true,
    },
    ...commonProperties,
  } as const,
} as const satisfies ElementRule

export const SearchControlAdditionRules = {
  itemType: "SearchControlAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "SearchControl",
    },
    ...commonProperties,
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "SingleSearchControlAddition",
  elementRule: SingleSearchControlAdditionRules,
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    if (!context.exportToXML.itemsTree) throw new Error("elementContext is not defined")
    const parent = getParentFromContext(context, ["Table"])
    const name = getSearchControlAdditionName(parent)
    return { name }
  },
})

registerElementRule("SearchControlAddition", SearchControlAdditionRules)
registerElementRule("SingleSearchControlAddition", SingleSearchControlAdditionRules)
