import { getParentFromContext } from "~/metadata/context/helpers"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContext } from "../../../context/types"
import { getElementId } from "../../../helpers/getElementId"
import { ElementRule } from "../../../orchestration/formElement/types"
import { getAutoCommandBarName } from "./helper"
export type { ElementRule, PropertyRule }

export const AutoCommandBarRules = {
  itemType: "AutoCommandBar",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.CommandBar",
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
      type: "CommandBarChildItems",
      toPartialYAML: false,
      fromPartialYAML: true,
      defaultValue: [],
    },
  },
  // registerAsType: {
  //   AutoCommandBar: {
  //     toXML: (_context: ConfigurationContext, _element: AutoCommandBar) => ({
  //       id: "-1",
  //       name: "ФормаКоманднаяПанель",
  //     }),
  //   },
  //   TableAutoCommandBar: {
  //     toXML: (context: ConfigurationContext, _element: AutoCommandBar) => {
  //       const parentTable = getParentFromContext(context, "Table")
  //       const elementId = getElementId(context)
  //       const elementName = getAutoCommandBarName(parentTable)
  //       return { id: elementId, name: elementName }
  //     },
  //   },
  // } as any,
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "AutoCommandBar",
  elementRule: AutoCommandBarRules,
  toXML: (_context: ConfigurationContext, _element: BaseElement | undefined) => ({
    id: "-1",
    name: "ФормаКоманднаяПанель",
  }),
})

registerElementAsType({
  propertyType: "TableAutoCommandBar",
  elementRule: AutoCommandBarRules,
  toXML: (context: ConfigurationContext, _element: BaseElement | undefined) => {
    const parentTable = getParentFromContext(context, "Table")
    const elementId = getElementId(context)
    const elementName = getAutoCommandBarName(parentTable)
    return { id: elementId, name: elementName }
  },
})

registerElementRule("AutoCommandBar", AutoCommandBarRules)
