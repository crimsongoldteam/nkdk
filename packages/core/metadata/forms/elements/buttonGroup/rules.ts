import { commandBarChildItemsRule } from "../../commonObjects/childItems/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
export type { ElementRule, PropertyRule }
export const ButtonGroupRules = {
  itemType: "ButtonGroup",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ButtonGroup",
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
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: false }),
    visible: booleanRule({ yaml: "Видимость", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    type: systemEnumerationRule({
      yaml: "Вид",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    }),
  },
} as const satisfies ElementRule
registerElementRule("ButtonGroup", ButtonGroupRules)
