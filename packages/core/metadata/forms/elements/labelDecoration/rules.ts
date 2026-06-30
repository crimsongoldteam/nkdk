import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
export type { ElementRule, PropertyRule }

export const LabelDecorationRules = {
  itemType: "LabelDecoration",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "FormDecorationType.Label",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    title: {
      yaml: "Заголовок",
      type: "FormattedI8nText",
    },
    type: {
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    },
    ...formDecorationCommonProperties,
    autoMaxHeight: { ...formDecorationCommonProperties.autoMaxHeight, implicitValueYAML: true },
    autoMaxWidth: { ...formDecorationCommonProperties.autoMaxWidth, implicitValueYAML: true },
    backColor: { yaml: "ЦветФона", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    border: { yaml: "Рамка", type: "Border", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    displayImportance: { ...formDecorationCommonProperties.displayImportance, implicitValueYAML: "Auto" },
    enabled: { ...formDecorationCommonProperties.enabled, implicitValueYAML: true },
    height: { ...formDecorationCommonProperties.height, implicitValueYAML: 0 },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Left",
    },
    horizontalAlignInGroup: { ...formDecorationCommonProperties.horizontalAlignInGroup, implicitValueYAML: "Auto" },
    horizontalStretch: { ...formDecorationCommonProperties.horizontalStretch, noImplicitValueYAML: true },
    hyperlink: { yaml: "Гиперссылка", type: "boolean", implicitValueYAML: false },
    skipOnInput: { ...formDecorationCommonProperties.skipOnInput, noImplicitValueYAML: true },
    titleHeight: { yaml: "ВысотаЗаголовка", type: "number", implicitValueYAML: 0 },
    toolTipRepresentation: { ...formDecorationCommonProperties.toolTipRepresentation, implicitValueYAML: "Auto" },
    verticalAlign: {
      yaml: "ВертикальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      implicitValueYAML: "Auto",
    },
    verticalAlignInGroup: { ...formDecorationCommonProperties.verticalAlignInGroup, implicitValueYAML: "Auto" },
    verticalStretch: { ...formDecorationCommonProperties.verticalStretch, noImplicitValueYAML: true },
    visible: { ...formDecorationCommonProperties.visible, implicitValueYAML: true },
    width: { ...formDecorationCommonProperties.width, implicitValueYAML: 0 },
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

registerElementRule("LabelDecoration", LabelDecorationRules)
