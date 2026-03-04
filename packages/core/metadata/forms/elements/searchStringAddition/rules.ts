import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { getSearchStringAdditionName } from "./helper"
export type { ElementRule, PropertyRule }

const commonProperties: MetadataItemRule["properties"] = {
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
}

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
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "SearchStringRepresentation",
    },
    ...commonProperties,
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "SearchStringAddition",
  elementRule: SingleSearchStringAdditionRules,
  toXML: (context: ConfigurationContext, _element: BaseElement | undefined) => {
    if (!context.elementsTree) throw new Error("elementContext is not defined")
    const parent = getParentFromContext(context, CollectionFormElementType.Table)
    const id = getElementId(context)
    const name = getSearchStringAdditionName(parent)
    return { name, id }
  },
})

registerElementRule("SearchStringAddition", SearchStringAdditionRules)
registerElementRule("SingleSearchStringAddition", SingleSearchStringAdditionRules)
