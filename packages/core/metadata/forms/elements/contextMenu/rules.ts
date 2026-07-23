import { commandBarChildItemsRule } from "../../commonObjects/childItems/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { getParentFromContext } from "../../../context/helpers"
import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { registerElementAsType, registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import { ElementRule } from "../../../orchestration/formElement/types"
import { getContextMenuName } from "./helper"
export type { ElementRule }
export const ContextMenuRules = {
  itemType: "ContextMenu",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.ContextMenu",
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
registerElementAsType({
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
registerElementRule("ContextMenu", ContextMenuRules)
