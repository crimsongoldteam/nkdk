import { MetadataItemRule } from "~/metadata/orchestration"

export const StructureItemGroupRules = {
  itemType: "StructureItemGroup",
  properties: {
    groupItems: {
      type: "GroupItem",
      xml: "dcsset:groupItems",
      yaml: "ПоляГруппировки",
    },
    item: {
      type: "StructureItem",
      xml: "dcsset:item",
      yaml: "Структура",
    },
  },
} as const satisfies MetadataItemRule
