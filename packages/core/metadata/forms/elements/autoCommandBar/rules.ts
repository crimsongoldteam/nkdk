import { getParentFromContext } from "~/metadata/context/helpers"
import { BaseElement } from "~/metadata/forms/elements/baseElement/types"
import { registerElementAsType, registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { getAutoCommandBarName } from "./helper"
export type { ElementRule, PropertyRule }

export const AutoCommandBarRules = {
  itemType: "AutoCommandBar",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.CommandBar",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      fromXML: false,
    },
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      toPartialYAML: false,
      required: true,
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
      required: true,
      defaultValue: [],
    },
  },
} as const satisfies ElementRule

registerElementAsType({
  propertyType: "AutoCommandBar",
  elementRule: AutoCommandBarRules,
  nameStyle: {
    canonicalSuffix: "ФормаКоманднаяПанель",
    referenceSuffixes: ["ФормаКоманднаяПанель", "FormCommandBar"],
  },
  toXML: () => ({
    id: "-1",
    name: "ФормаКоманднаяПанель",
  }),
})

registerElementAsType({
  propertyType: "TableAutoCommandBar",
  elementRule: AutoCommandBarRules,
  nameStyle: {
    canonicalSuffix: "КоманднаяПанель",
    referenceSuffixes: ["КоманднаяПанель", "CommandBar"],
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML; element: BaseElement | undefined }) => {
    const { context } = params
    const parentTable = getParentFromContext(context, ["Table"])
    const elementName = getAutoCommandBarName(parentTable)
    return { name: elementName }
  },
})

registerElementRule("AutoCommandBar", AutoCommandBarRules)
