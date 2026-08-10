import { detectGroupItemAutoYAML } from "../items/groupItemAuto/detectYAML"
import type { StructureItemGroupCollectionItem, StructureItemGroupCollectionItemYAML } from "./types"

export type StructureItemGroupRegistryItem = {
  itemType: StructureItemGroupCollectionItem["itemType"]
  xmlKey: string
  detectYAML: (yaml: StructureItemGroupCollectionItemYAML) => boolean
}

export const StructureItemGroupRegistry: StructureItemGroupRegistryItem[] = [
  {
    itemType: "GroupItemAuto",
    xmlKey: "dcsset:GroupItemAuto",
    detectYAML: detectGroupItemAutoYAML,
  },
  {
    itemType: "GroupItemField",
    xmlKey: "dcsset:GroupItemField",
    detectYAML: () => true,
  },
]
