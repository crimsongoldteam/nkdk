import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { getSearchStringAdditionName } from "./helper"
export type { ElementRule, PropertyRule }

const commonProperties = {
  backColor: { yaml: "ЦветФона", type: "Color" },
  borderColor: { yaml: "ЦветРамки", type: "Color" },
  font: { yaml: "Шрифт", type: "Font" },
  horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
  textColor: { yaml: "ЦветТекста", type: "Color" },
  maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
  width: { yaml: "Ширина", type: "number" },
  contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
  displayImportance: {
    yaml: "ВажностьПриОтображении",
    xml: "_DisplayImportance",
    type: "SystemEnumeration",
    typeSE: "DisplayImportance",
    defaultValueYAML: "Auto",
  },
  enabled: { yaml: "Доступность", type: "boolean" },
  extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    defaultValueYAML: "Auto",
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
    defaultValueYAML: "Auto",
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
    defaultValueYAML: "Auto",
  },
  visible: { yaml: "Видимость", type: "boolean" },
} as const satisfies MetadataItemRule["properties"]

export const SingleSearchStringAdditionRules = {
  itemType: "SingleSearchStringAddition",
  enterpriseField: "FormField",
  enterpriseFieldType: "None",
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "SearchStringRepresentation",
      fromXML: false,
      forSingleElement: true,
    },
    ...commonProperties,
  },
} as const satisfies ElementRule

export const SearchStringAdditionRules = {
  itemType: "SearchStringAddition",
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
      additionalSourceType: "SearchStringRepresentation",
    },
    ...commonProperties,
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "SingleSearchStringAddition",
  elementRule: SingleSearchStringAdditionRules,
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
