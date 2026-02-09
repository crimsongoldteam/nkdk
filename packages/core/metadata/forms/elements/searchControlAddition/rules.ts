import { getParentFromContext } from "~/metadata/context/helpers"
import { getElementId } from "~/metadata/helpers/getElementId"
import { FormElementType } from "~/metadata/metadataFactory"
import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { getSearchControlAdditionName } from "./helper"
import { SearchControlAddition, SingleSearchControlAddition } from "./types"
export type { ElementRule, PropertyRule }

const commonProperties: ElementRule<SearchControlAddition>["properties"] = {
  autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
  backColor: { yaml: "ЦветФона", type: "Color" },
  borderColor: { yaml: "ЦветРамки", type: "Color" },
  childItems: { yaml: "ПодчиненныеЭлементы", type: "ChildItems", defaultValue: [] },
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
  width: { yaml: "Ширина", type: "number" },
}

export const SingleSearchControlAdditionRules: ElementRule<SingleSearchControlAddition, "additionSource"> = {
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "SearchControl",
      fromXML: false,
      forSingleElement: true,
    },
    ...commonProperties,
  },
  registerAsType: {
    SearchControlAddition: {
      toXML: (context, _element) => {
        if (!context.elementsTree) throw new Error("elementContext is not defined")
        const parent = getParentFromContext(context, FormElementType.Table)
        const id = getElementId(context)
        const name = getSearchControlAdditionName(parent)
        return { name, id }
      },
    },
  },
}

export const SearchControlAdditionRules: ElementRule<SearchControlAddition> = {
  properties: {
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "SearchControl",
    },
    ...commonProperties,
  },
}

registerElementRule("SearchControlAddition", SearchControlAdditionRules)
registerElementRule("SingleSearchControlAddition", SingleSearchControlAdditionRules)
