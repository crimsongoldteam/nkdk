import { borderRule } from "~/metadata/commonObjects/border/types"
import { colorRule } from "~/metadata/commonObjects/color/types"
import { formattedI8nTextRule } from "~/metadata/commonObjects/formattedI8nText/types"
import { eventsRule } from "~/metadata/forms/commonObjects/event/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
export type { ElementRule, PropertyRule }
export const LabelDecorationRules = {
  itemType: "LabelDecoration",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "FormDecorationType.Label",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    title: formattedI8nTextRule({
      yaml: "Заголовок",
    }),
    type: systemEnumerationRule({
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    }),
    ...formDecorationCommonProperties,
    autoMaxHeight: { ...formDecorationCommonProperties.autoMaxHeight, implicitValueYAML: true },
    autoMaxWidth: { ...formDecorationCommonProperties.autoMaxWidth, implicitValueYAML: true },
    backColor: colorRule({
      yaml: "ЦветФона",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    border: borderRule({
      yaml: "Рамка",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    displayImportance: { ...formDecorationCommonProperties.displayImportance, implicitValueYAML: "Auto" },
    enabled: { ...formDecorationCommonProperties.enabled, implicitValueYAML: true },
    height: { ...formDecorationCommonProperties.height, implicitValueYAML: 0 },
    horizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложение",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Left",
    }),
    horizontalAlignInGroup: { ...formDecorationCommonProperties.horizontalAlignInGroup, implicitValueYAML: "Auto" },
    horizontalStretch: { ...formDecorationCommonProperties.horizontalStretch, noImplicitValueYAML: true },
    hyperlink: booleanRule({ yaml: "Гиперссылка", implicitValueYAML: false }),
    skipOnInput: { ...formDecorationCommonProperties.skipOnInput, noImplicitValueYAML: true },
    titleHeight: numberRule({ yaml: "ВысотаЗаголовка", implicitValueYAML: 0 }),
    toolTipRepresentation: { ...formDecorationCommonProperties.toolTipRepresentation, implicitValueYAML: "Auto" },
    verticalAlign: systemEnumerationRule({
      yaml: "ВертикальноеПоложение",
      typeSE: "ItemVerticalAlign",
      implicitValueYAML: "Auto",
    }),
    verticalAlignInGroup: { ...formDecorationCommonProperties.verticalAlignInGroup, implicitValueYAML: "Auto" },
    verticalStretch: { ...formDecorationCommonProperties.verticalStretch, noImplicitValueYAML: true },
    visible: { ...formDecorationCommonProperties.visible, implicitValueYAML: true },
    width: { ...formDecorationCommonProperties.width, implicitValueYAML: 0 },
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        click: "Нажатие",
        uRLProcessing: "ОбработкаНавигационнойСсылки",
      },
    }),
  },
} as const satisfies ElementRule
registerElementRule("LabelDecoration", LabelDecorationRules)
