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
    name: {
      type: "string",
      xml: "_name",
      fromXML: false,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    autofill: { yaml: "Автозаполнение", xml: "Autofill", type: "boolean" },
    childItems: {
      yaml: "Элементы",
      xml: "ChildItems",
      type: "CommandBarChildItems",
      defaultValue: [],
      required: true,
    },
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "ContextMenu",
  elementRule: ContextMenuRules,
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parent = getParentFromContext(context)
    const name = getContextMenuName(parent)
    return { name }
  },
})

registerElementRule("ContextMenu", ContextMenuRules)
