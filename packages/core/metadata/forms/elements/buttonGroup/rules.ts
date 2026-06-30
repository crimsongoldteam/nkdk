import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { formGroupCommonProperties } from "../formGroup/rules"
import { PropertyRule } from "~/metadata/orchestration/property/types"
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
    childItems: {
      yaml: "Элементы",
      type: "CommandBarChildItems",
      defaultValue: [],
    },
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
