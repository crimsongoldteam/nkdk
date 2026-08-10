import { commandBarChildItemsRule } from "../../commonObjects/childItems/rules"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { getParentFromContext } from "../../../context/helpers"
import { defineElementAsType, defineElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { ElementRule } from "../../../ruleRuntime/formElement/types"
import { getAutoCommandBarName } from "./helper"
export type { ElementRule, PropertyRule }
export const AutoCommandBarRules = {
  itemType: "AutoCommandBar",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.CommandBar",
  xmlOrder: [
    "horizontalAlign",
    "autofill",
    "childItems",
    "name",
    "displayImportance",
  ],
  properties: {
    name: stringRule({
      xml: "_name",
      fromXML: false,
    }),
    autofill: booleanRule({
      yaml: "Автозаполнение",
      defaultValue: true,
      implicitValueYAML: "Истина",
    }),
    displayImportance: systemEnumerationRule({
      yaml: "ВажностьПриОтображении",
      typeSE: "DisplayImportance",
      xml: "_DisplayImportance",
      implicitValueYAML: "Auto",
    }),
    horizontalAlign: systemEnumerationRule({
      yaml: "ГоризонтальноеПоложение",
      typeSE: "ItemHorizontalLocation",
      implicitValueYAML: "Left",
    }),
    childItems: commandBarChildItemsRule({
      yaml: "Элементы",
      defaultValue: [],
    }),
  },
} as const satisfies ElementRule
export const metadataRuleLayer000 = defineElementAsType({
  propertyType: "AutoCommandBar",
  elementRule: AutoCommandBarRules,
  nameStyle: {
    canonicalSuffix: "ФормаКоманднаяПанель",
    referenceSuffixes: ["ФормаКоманднаяПанель", "FormCommandBar"],
    canonicalNameMode: "fixed",
  },
  directId: "-1",
  toXML: () => ({
    id: "-1",
    name: "ФормаКоманднаяПанель",
  }),
})
export const metadataRuleLayer001 = defineElementAsType({
  propertyType: "TableAutoCommandBar",
  elementRule: AutoCommandBarRules,
  nameStyle: {
    canonicalSuffix: "КоманднаяПанель",
    referenceSuffixes: ["КоманднаяПанель", "CommandBar"],
    canonicalNameMode: "ownerSuffix",
  },
  toXML: (params: { context: ConfigurationContextWithExportToXML }) => {
    const { context } = params
    const parentTable = getParentFromContext(context, ["Table"])
    const elementName = getAutoCommandBarName(parentTable)
    return { name: elementName }
  },
})
export const metadataRuleLayer002 = defineElementRule("AutoCommandBar", AutoCommandBarRules)
