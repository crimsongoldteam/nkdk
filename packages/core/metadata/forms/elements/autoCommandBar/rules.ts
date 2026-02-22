import { getParentFromContext } from "~/metadata/context/helpers"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { registerElementRule } from "~/metadata/metadataFactory/elements/ruleFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ConfigurationContext } from "../../../context/types"
import { getElementId } from "../../../helpers/getElementId"
import { ElementRule } from "../../../metadataFactory/elements/types"
import { getAutoCommandBarName } from "./helper"
import { AutoCommandBar } from "./types"
export type { ElementRule, PropertyRule }

export const AutoCommandBarRules: ElementRule<AutoCommandBar> = {
  properties: {
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      defaultValueXML: true,
      toPartialYAML: false,
    },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
      xml: "_DisplayImportance",
    },
    horizontalAlign: {
      yaml: "ГоризонтальноеПоложение",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    childItems: {
      type: "ChildItems",
      toPartialYAML: false,
      fromPartialYAML: true,
      defaultValue: [],
    },
  },
  registerAsType: {
    AutoCommandBar: {
      toXML: (_context: ConfigurationContext, _element: AutoCommandBar) => ({
        id: "-1",
        name: "ФормаКоманднаяПанель",
      }),
    },
    TableAutoCommandBar: {
      toXML: (context: ConfigurationContext, _element: AutoCommandBar) => {
        const parentTable = getParentFromContext(context, CollectionFormElementType.Table)
        const elementId = getElementId(context)
        const elementName = getAutoCommandBarName(parentTable)
        return { id: elementId, name: elementName }
      },
    },
  } as any,
}

registerElementRule("AutoCommandBar", AutoCommandBarRules)
