import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { registerElementAsType, registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { BaseElement } from "../baseElement/types"
import { getExtendedTooltipName } from "./helper"
export type { ElementRule, PropertyRule }

export const ExtendedTooltipRules = {
  itemType: "ExtendedTooltip",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "None",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    enabled: { yaml: "Доступность", type: "boolean" },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string", toEnterprise: false },
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    title: {
      type: "FormattedI8nText",
      yaml: "Заголовок",
      yamlFormatted: "ФорматированныйЗаголовок",
    },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
      toEnterprise: false,
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
  },
  // registerAsType: {
  //   ExtendedTooltip: {
  //     toXML: (context, _element) => {
  //       if (!context.elementsTree) throw new Error("elementContext is not defined")
  //       const parent = getParentFromContext(context)
  //       const id = getElementId(context)
  //       const name = getExtendedTooltipName(parent)
  //       return { id, name }
  //     },
  //   },
  // },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "ExtendedTooltip",
  elementRule: ExtendedTooltipRules,
  toXML: (context: ConfigurationContext, _element: BaseElement | undefined) => {
    const parent = getParentFromContext(context)
    const id = getElementId(context)
    const name = getExtendedTooltipName(parent)
    return { id, name }
  },
})

registerElementRule("ExtendedTooltip", ExtendedTooltipRules)
