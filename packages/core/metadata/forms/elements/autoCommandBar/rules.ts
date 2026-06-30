import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
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
    childItems: {
      yaml: "Элементы",
      type: "CommandBarChildItems",
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
