import { MetadataItemRule } from "~/metadata/orchestration"

export const StructureItemGroupRules = {
  itemType: "StructureItemGroup",
  properties: {
    groupItems: {
      type: "StructureItemGroupCollection",
      xml: "dcsset:item",
      xmlParents: ["dcsset:groupItems"],
      yaml: "ПоляГруппировки",
    },
    item: {
      type: "StructureItemGroup",
      xml: "dcsset:item",
      yaml: "Структура",
    },
  },
} as const satisfies MetadataItemRule
