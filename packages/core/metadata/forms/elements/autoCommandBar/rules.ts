import { getParentFromContext } from "~/metadata/context/helpers"
import { FormElementType } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ConfigurationContext } from "../../../context/types"
import { getElementId } from "../../../helpers/getElementId"
import { ElementRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { getAutoCommandBarName } from "./helper"
import { AutoCommandBar } from "./types"
export type { ElementRule, PropertyRule }

export const AutoCommandBarRules: ElementRule<AutoCommandBar> = {
  properties: {
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
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
        const parentTable = getParentFromContext(context, FormElementType.Table)
        const elementId = getElementId(context)
        const elementName = getAutoCommandBarName(parentTable)
        return { id: elementId, name: elementName }
      },
    },
  } as any,
}

registerElementRule("AutoCommandBar", AutoCommandBarRules)
