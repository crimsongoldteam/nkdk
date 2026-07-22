import { commandBarChildItemsRule } from "../../commonObjects/childItems/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { getParentFromContext } from "../../../context/helpers"
import { registerElementAsType, registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { getAutoCommandBarName } from "./helper"
export type { ElementRule, PropertyRule }
export const AutoCommandBarRules = {
  itemType: "AutoCommandBar",
  enterpriseField: "FormGroup",
  enterpriseFieldType: "FormGroupType.CommandBar",
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
registerElementAsType({
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
registerElementAsType({
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
registerElementRule("AutoCommandBar", AutoCommandBarRules)
