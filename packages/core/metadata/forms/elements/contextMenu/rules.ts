import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { getElementId } from "~/metadata/helpers/getElementId"
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
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    autofill: { yaml: "Автозаполнение", xml: "Autofill", type: "boolean" },
    childItems: {
      yaml: "ПодчиненныеЭлементы",
      xml: "ChildItems",
      type: "ChildItems",
      defaultValue: [],
    },
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "ContextMenu",
  elementRule: ContextMenuRules,
  toXML: (context: ConfigurationContext, _element: BaseElement | undefined) => {
    const parent = getParentFromContext(context)
    const id = getElementId(context)
    const name = getContextMenuName(parent)
    return { id, name }
  },
})

registerElementRule("ContextMenu", ContextMenuRules)
