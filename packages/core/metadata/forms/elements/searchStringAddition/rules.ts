import { getParentFromContext } from "~/metadata/context/helpers"
import { getElementId } from "~/metadata/helpers/getElementId"
import { FormElementType } from "~/metadata/metadataFactory"
import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { getSearchStringAdditionName } from "./helper"
import { SearchStringAddition, SingleSearchStringAddition } from "./types"
export type { ElementRule, PropertyRule }

const commonProperties: ElementRule<SearchStringAddition>["properties"] = {
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

export const SingleSearchStringAdditionRules: ElementRule<SingleSearchStringAddition, "additionSource"> = {
  properties: {
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "SearchStringRepresentation",
      fromXML: false,
      forSingleElement: true,
    },
    ...commonProperties,
  } as any,
  registerAsType: {
    SearchStringAddition: {
      toXML: (context, _element) => {
        if (!context.elementsTree) throw new Error("elementContext is not defined")
        const parent = getParentFromContext(context, FormElementType.Table)
        const id = getElementId(context)
        const name = getSearchStringAdditionName(parent)
        return { name, id }
      },
    },
  },
}

export const SearchStringAdditionRules: ElementRule<SearchStringAddition> = {
  properties: {
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "SearchStringRepresentation",
    },
    ...commonProperties,
  },
}

registerElementRule("SearchStringAddition", SearchStringAdditionRules)
registerElementRule("SingleSearchStringAddition", SingleSearchStringAdditionRules)
