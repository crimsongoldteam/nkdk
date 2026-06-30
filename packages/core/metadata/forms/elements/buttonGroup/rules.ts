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
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      implicitValueYAML: "Auto",
    },
    childItems: {
      yaml: "Элементы",
      type: "CommandBarChildItems",
      defaultValue: [],
    },
    // В XML CommandSource идёт сразу после ChildItems
    commandSource: { yaml: "ИсточникКоманд", type: "string" },
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "ButtonGroupRepresentation",
      implicitValueYAML: "Auto",
    },
    ...formGroupCommonProperties,
    height: { yaml: "Высота", type: "number", implicitValueYAML: 0 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: false },
    visible: { yaml: "Видимость", type: "boolean", implicitValueYAML: true },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 0 },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    },
  },
} as const satisfies ElementRule

registerElementRule("ButtonGroup", ButtonGroupRules)
