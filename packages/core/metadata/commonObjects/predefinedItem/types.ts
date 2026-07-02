import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { PredefinedItemRules } from "./rules"

export type PredefinedItem = MetadataTypeByRule<typeof PredefinedItemRules>
export type PredefinedItemYAML = YAMLTypeByRule<typeof PredefinedItemRules>

export type PredefinedItemCollection = PredefinedItem[]
export type PredefinedItemCollectionYAML = Record<string, PredefinedItemYAML>

registerMetadataItemRule({
  propertyType: "PredefinedItem",
  itemRule: PredefinedItemRules,
})

registerMetadataItemCollectionRule({
  propertyType: "PredefinedItemCollection",
  itemRule: PredefinedItemRules,
  xmlElement: "Item",
  keyField: "name",
})
