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
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    autofill: { yaml: "Автозаполнение", type: "boolean" },
    childItems: {
      type: "CommandBarChildItems",
      defaultValue: [],
      fromPartialYAML: true,
      toPartialYAML: false,
      required: true,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      xml: "HorizontalLocation",
    },
    commandSource: { yaml: "ИсточникКоманд", type: "string" },
    ...formGroupCommonProperties,
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormGroupType",
      runtimeOnly: true,
    },
  },
} as const satisfies ElementRule

registerElementRule("CommandBar", CommandBarRules)
