import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
    type: systemEnumerationRule({
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    }),
    ...extendedTooltipCommonProperties,
    autoMaxHeight: { ...extendedTooltipCommonProperties.autoMaxHeight, implicitValueYAML: true },
    autoMaxWidth: { ...extendedTooltipCommonProperties.autoMaxWidth, implicitValueYAML: true },
    backColor: {
      yaml: "ЦветФона",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    border: {
      yaml: "Рамка",
      type: "Border",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    },
    borderColor: {
      yaml: "ЦветРамки",
      type: "Color",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    },
    displayImportance: { ...extendedTooltipCommonProperties.displayImportance, implicitValueYAML: "Auto" },
    enabled: { ...extendedTooltipCommonProperties.enabled, noImplicitValueYAML: true },
    height: { ...extendedTooltipCommonProperties.height, implicitValueYAML: 0 },
    horizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложение",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Left",
    }),
    horizontalAlignInGroup: { ...extendedTooltipCommonProperties.horizontalAlignInGroup, implicitValueYAML: "Auto" },
    horizontalStretch: { ...extendedTooltipCommonProperties.horizontalStretch, noImplicitValueYAML: true },
    hyperlink: booleanRule({ yaml: "Гиперссылка", implicitValueYAML: false }),
    skipOnInput: { ...extendedTooltipCommonProperties.skipOnInput, noImplicitValueYAML: true },
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
    toolTipRepresentation: { ...extendedTooltipCommonProperties.toolTipRepresentation, noImplicitValueYAML: true },
    verticalAlign: systemEnumerationRule({
      yaml: "ВертикальноеПоложение",
      typeSE: "ItemVerticalAlign",
      implicitValueYAML: "Auto",
    }),
    verticalAlignInGroup: { ...extendedTooltipCommonProperties.verticalAlignInGroup, implicitValueYAML: "Auto" },
    verticalStretch: { ...extendedTooltipCommonProperties.verticalStretch, noImplicitValueYAML: true },
    visible: { ...extendedTooltipCommonProperties.visible, noImplicitValueYAML: true },
    width: { ...extendedTooltipCommonProperties.width, implicitValueYAML: 0 },
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
