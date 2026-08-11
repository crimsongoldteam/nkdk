import { commandBarChildItemsRule } from "../../commonObjects/childItems/rules"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
export type { ElementRule, PropertyRule }
export const ButtonGroupRules = {
  itemType: "ButtonGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ButtonGroup",
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
    "commandSource",
    "representation",
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
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    childItems: commandBarChildItemsRule({
      yaml: "Элементы",
      defaultValue: [],
    }),
    // В XML CommandSource идёт сразу после ChildItems
    commandSource: stringRule({ yaml: "ИсточникКоманд" }),
    representation: systemEnumerationRule({
      yaml: "Отображение",
      typeSE: "ButtonGroupRepresentation",
      implicitValueYAML: "Auto",
    }),
    ...formGroupCommonProperties,
    height: numberRule({ yaml: "Высота", implicitValueYAML: 0 }),
    visible: booleanRule({ yaml: "Видимость", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    }),
  },
} as const satisfies ElementRule
export const metadataRuleLayer000 = defineElementRule("ButtonGroup", ButtonGroupRules)
