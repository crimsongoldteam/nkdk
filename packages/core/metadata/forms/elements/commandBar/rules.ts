import { commandBarChildItemsRule } from "../../commonObjects/childItems/rules"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import type { PropertyRule } from "../../../ruleRuntime/property/types"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
export type { ElementRule, PropertyRule }
export const CommandBarRules = {
  itemType: "CommandBar",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.CommandBar",
  xmlOrder: [
    "visible",
    "userVisible",
    "enabled",
    "readOnly",
    "enableContentChange",
    "title",
    "titleTextColor",
    "titleFont",
    "toolTip",
    "toolTipRepresentation",
    "width",
    "height",
    "horizontalStretch",
    "verticalStretch",
    "horizontalAlignInGroup",
    "verticalAlignInGroup",
    "horizontalAlign",
    "commandSource",
    "extendedTooltip",
    "childItems",
    "name",
    "displayImportance",
  ],
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    autofill: booleanRule({ yaml: "Автозаполнение", implicitValueYAML: false }),
    childItems: commandBarChildItemsRule({
      yaml: "Элементы",
      defaultValue: [],
    }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    horizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложение",
      typeSE: "ItemHorizontalLocation",
      xml: "HorizontalLocation",
      implicitValueYAML: "Left",
    }),
    commandSource: stringRule({ yaml: "ИсточникКоманд" }),
    ...formGroupCommonProperties,
    height: {
      ...formGroupCommonProperties.height,
      implicitValueYAML: 0,
    },
    shortcut: {
      ...formGroupCommonProperties.shortcut,
      toYAML: false,
      fromYAML: false,
    },
    visible: {
      ...formGroupCommonProperties.visible,
      implicitValueYAML: true,
    },
    width: {
      ...formGroupCommonProperties.width,
      implicitValueYAML: 0,
    },
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    }),
  },
} as const satisfies ElementRule
export const metadataRuleLayer000 = defineElementRule("CommandBar", CommandBarRules)
