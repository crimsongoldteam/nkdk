import { commandBarChildItemsRule } from "../../commonObjects/childItems/rules"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { getParentFromContext } from "../../../context/helpers"
import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { defineElementAsType, defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { getContextMenuName } from "./helper"
export type { ElementRule }
export const ContextMenuRules = {
  itemType: "ContextMenu",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ContextMenu",
  xmlOrder: [
    "autofill",
    "childItems",
    "name",
  ],
  properties: {
    name: stringRule({
      xml: "_name",
      fromXML: false,
    }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      typeSE: "DisplayImportance",
      noImplicitValueYAML: true,
    }),
    autofill: booleanRule({ yaml: "Автозаполнение", xml: "Autofill", noImplicitValueYAML: true }),
    childItems: commandBarChildItemsRule({
      yaml: "Элементы",
      xml: "ChildItems",
      defaultValue: [],
    }),
  },
} as const satisfies ElementRule
export const metadataRuleLayer000 = defineElementAsType({
  propertyType: "ContextMenu",
  elementRule: ContextMenuRules,
  nameStyle: {
    canonicalSuffix: "КонтекстноеМеню",
    referenceSuffixes: ["КонтекстноеМеню", "ContextMenu"],
    canonicalNameMode: "ownerSuffix",
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML }) => {
    const { context } = params
    const parent = getParentFromContext(context)
    const name = getContextMenuName(parent)
    return { name }
  },
})
export const metadataRuleLayer001 = defineElementRule("ContextMenu", ContextMenuRules)
