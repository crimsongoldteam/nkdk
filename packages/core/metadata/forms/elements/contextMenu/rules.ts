import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { ElementRule } from "../../../orchestration/formElement/types"
import { BaseElement } from "../baseElement/types"
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
    childItems: {
      yaml: "Элементы",
      xml: "ChildItems",
      type: "CommandBarChildItems",
      defaultValue: [],
    },
  },
} as const satisfies ElementRule
registerElementAsType({
  propertyType: "ContextMenu",
  elementRule: ContextMenuRules,
  nameStyle: {
    canonicalSuffix: "КонтекстноеМеню",
    referenceSuffixes: ["КонтекстноеМеню", "ContextMenu"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context)
    const name = getContextMenuName(parent)
    return { name }
  },
})
registerElementRule("ContextMenu", ContextMenuRules)
