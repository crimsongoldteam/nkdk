import { getParentFromContext } from "~/metadata/context/helpers"
import { getElementId } from "~/metadata/helpers/getElementId"
import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { getContextMenuName } from "./helper"
import { ContextMenu } from "./types"
export type { ElementRule }

export const ContextMenuRules: ElementRule<ContextMenu> = {
  enterpriseFieldType: "FormGroup.ContextMenu",
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
  registerAsType: {
    ContextMenu: {
      toXML: (context, _element) => {
        if (!context.elementsTree) throw new Error("elementContext is not defined")
        const parent = getParentFromContext(context)
        const id = getElementId(context)
        const name = getContextMenuName(parent)
        return { id, name }
      },
    },
  },
}

registerElementRule("ContextMenu", ContextMenuRules)
