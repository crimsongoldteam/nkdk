import { GroupItemAuto, GroupItemAutoYAML } from "../items/groupItemAuto/types"
import { GroupItemField, GroupItemFieldYAML } from "../items/groupItemField/types"

export type StructureItemGroupCollectionItem = GroupItemField | GroupItemAuto

export type StructureItemGroupCollection = StructureItemGroupCollectionItem[]

export type StructureItemGroupCollectionItemYAML = GroupItemFieldYAML | GroupItemAutoYAML

export type StructureItemGroupCollectionYAML = StructureItemGroupCollectionItemYAML[]
