import { ElementRule, PropertyRule } from "../../../metadataFactory/elementRulesFactory"
import { AutoCommandBar } from "./types"
export type { ElementRule, PropertyRule }

export const AutoCommandBarRules: ElementRule<AutoCommandBar> = {
  enterpriseField: "AutoCommandBar",
  properties: {
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
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
      yaml: "ПодчиненныеЭлементы",
      type: "ChildItems",
    },
  },
}
