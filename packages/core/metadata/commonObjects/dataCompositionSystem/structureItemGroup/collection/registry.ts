import { detectGroupItemAutoYAML } from "../items/groupItemAuto/detectYAML"

export type StructureItemGroupRegistryItem = {
  itemType: string
  xmlKey: string
  detectYAML: (yaml: string) => boolean
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
