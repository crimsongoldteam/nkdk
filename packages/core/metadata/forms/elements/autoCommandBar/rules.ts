import { ElementRule, PropertyRule } from "../../../metadataFactory/elementRulesFactory"
import { AutoCommandBar } from "./types"
export type { ElementRule, PropertyRule }

export const AutoCommandBarRules: ElementRule<AutoCommandBar> = {
  properties: {
    autofill: {
      yaml: "Автозаполнение",
      type: "boolean",
      defaultValue: true,
      toYAML: false,
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
      toYAML: false,
      defaultValue: [],
    },
  },
}
