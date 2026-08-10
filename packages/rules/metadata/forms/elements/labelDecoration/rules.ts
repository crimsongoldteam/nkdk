import { borderRule } from "../../../commonObjects/border/types"
import { colorRule } from "../../../commonObjects/color/types"
import { formattedI8nTextRule } from "../../../commonObjects/formattedI8nText/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
export type { ElementRule, PropertyRule }
export const LabelDecorationRules = {
  itemType: "LabelDecoration",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "FormDecorationType.Label",
  xmlOrder: [
    "visible",
    "userVisible",
    "enabled",
    "width",
    "autoMaxWidth",
    "maxWidth",
    "height",
    "autoMaxHeight",
    "maxHeight",
    "horizontalStretch",
    "verticalStretch",
    "skipOnInput",
    "textColor",
    "font",
    "shortcut",
    "title",
    "toolTip",
    "toolTipRepresentation",
    "horizontalAlignInGroup",
    "verticalAlignInGroup",
    "onMainServerUnavalableBehavior",
    "hyperlink",
    "horizontalAlign",
    "verticalAlign",
    "titleHeight",
    "backColor",
    "borderColor",
    "border",
    "contextMenu",
    "extendedTooltip",
    "events",
    "name",
    "displayImportance",
  ],
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    title: formattedI8nTextRule({
      yaml: "Заголовок",
      preserveEmptyXML: true,
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
export const metadataRuleLayer000 = defineElementRule("LabelDecoration", LabelDecorationRules)
