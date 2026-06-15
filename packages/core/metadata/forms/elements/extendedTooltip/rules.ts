import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
import { getExtendedTooltipName } from "./helper"
export type { ElementRule, PropertyRule }

const extendedTooltipCommonProperties = {
  autoMaxHeight: formDecorationCommonProperties.autoMaxHeight,
  autoMaxWidth: formDecorationCommonProperties.autoMaxWidth,
  displayImportance: formDecorationCommonProperties.displayImportance,
  enabled: formDecorationCommonProperties.enabled,
  font: formDecorationCommonProperties.font,
  height: formDecorationCommonProperties.height,
  horizontalAlignInGroup: formDecorationCommonProperties.horizontalAlignInGroup,
  horizontalStretch: formDecorationCommonProperties.horizontalStretch,
  maxHeight: formDecorationCommonProperties.maxHeight,
  maxWidth: formDecorationCommonProperties.maxWidth,
  onMainServerUnavalableBehavior: formDecorationCommonProperties.onMainServerUnavalableBehavior,
  shortcut: formDecorationCommonProperties.shortcut,
  skipOnInput: formDecorationCommonProperties.skipOnInput,
  textColor: formDecorationCommonProperties.textColor,
  toolTip: formDecorationCommonProperties.toolTip,
  toolTipRepresentation: formDecorationCommonProperties.toolTipRepresentation,
  userVisible: formDecorationCommonProperties.userVisible,
  verticalAlignInGroup: formDecorationCommonProperties.verticalAlignInGroup,
  verticalStretch: formDecorationCommonProperties.verticalStretch,
  visible: formDecorationCommonProperties.visible,
  width: formDecorationCommonProperties.width,
} as const satisfies ElementRule["properties"]

export const ExtendedTooltipRules = {
  itemType: "ExtendedTooltip",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "None",
  properties: {
    title: {
      type: "FormattedI8nText",
      yaml: "Заголовок",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
      implicitValueYAML: "Label",
    },
    ...extendedTooltipCommonProperties,
    backColor: { yaml: "ЦветФона", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    border: { yaml: "Рамка", type: "Border", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    hyperlink: { yaml: "Гиперссылка", type: "boolean" },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number" },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        click: "Нажатие",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
      },
    },
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "ExtendedTooltip",
  elementRule: ExtendedTooltipRules,
  nameStyle: {
    canonicalSuffix: "РасширеннаяПодсказка",
    referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context)
    const name = getExtendedTooltipName(parent)
    return { name }
  },
})

registerElementRule("ExtendedTooltip", ExtendedTooltipRules)
