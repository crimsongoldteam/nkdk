import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const PredefinedItemRules = {
  itemType: "PredefinedItem",
  properties: {
    id: {
      ...uuidPropertyRule,
      xml: "_id",
    },
    name: {
      type: "string",
      xml: "Name",
      required: true,
    },
    code: {
      type: "PredefinedCode",
      xml: "Code",
      yaml: "Код",
      required: true,
    },
    description: {
      type: "string",
      xml: "Description",
      yaml: "Наименование",
      required: true,
    },
    isFolder: {
      type: "boolean",
      xml: "IsFolder",
      yaml: "ЭтоГруппа",
      defaultValue: false,
      defaultValueXML: false,
      defaultValueYAML: "Ложь",
    },
    childItems: {
      type: "PredefinedItemCollection",
      xml: "ChildItems",
      yaml: "Элементы",
    },
  },
} as const satisfies MetadataItemRule
