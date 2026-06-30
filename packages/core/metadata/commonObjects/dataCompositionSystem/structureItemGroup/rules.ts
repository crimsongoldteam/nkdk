import { structureItemGroupCollectionRule } from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/collection/types"
import { structureItemGroupRule } from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/types"
import { MetadataItemRule } from "~/metadata/orchestration"
export const StructureItemGroupRules = {
  itemType: "StructureItemGroup",
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
