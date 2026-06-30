import { commandBarChildItemsRule } from "~/metadata/forms/commonObjects/childItems/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }
export const CommandBarRules = {
  itemType: "CommandBar",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.CommandBar",
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
    horizontalStretch: {
      ...formGroupCommonProperties.horizontalStretch,
      implicitValueYAML: false,
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
registerElementRule("CommandBar", CommandBarRules)
