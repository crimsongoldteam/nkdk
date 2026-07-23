import { structureItemGroupCollectionRule } from "./collection/types"
import { structureItemGroupRule } from "./builders"
import { MetadataItemRule } from "../../../orchestration"
export const StructureItemGroupRules = {
  itemType: "StructureItemGroup",
  xsiType: "dcsset:StructureItemGroup",
  properties: {
    groupItems: structureItemGroupCollectionRule({
      xml: "dcsset:item",
      xmlParents: ["dcsset:groupItems"],
      yaml: "ПоляГруппировки",
    }),
    item: structureItemGroupRule({
      xml: "dcsset:item",
      yaml: "Структура",
    }),
  },
} as const satisfies MetadataItemRule
