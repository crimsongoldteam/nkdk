import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { ExchangePlanContentItemRules, ExchangePlanContentRules } from "./rules"

export type ExchangePlanContentItem = MetadataTypeByRule<typeof ExchangePlanContentItemRules>
export type ExchangePlanContentItemYAML = YAMLTypeByRule<typeof ExchangePlanContentItemRules>

export type ExchangePlanContentItems = ExchangePlanContentItem[]
export type ExchangePlanContentItemsYAML = ExchangePlanContentItemYAML[]

export type ExchangePlanContent = MetadataTypeByRule<typeof ExchangePlanContentRules>
export type ExchangePlanContentYAML = YAMLTypeByRule<typeof ExchangePlanContentRules>

registerMetadataItemRule({
  propertyType: "ExchangePlanContentItem",
  itemRule: ExchangePlanContentItemRules,
})

registerMetadataItemCollectionRule({
  propertyType: "ExchangePlanContentItems",
  itemRule: ExchangePlanContentItemRules,
  xmlElement: "Item",
  keyField: "metadata",
  yamlAsArray: true,
})

registerMetadataItemRule({
  propertyType: "ExchangePlanContent",
  itemRule: ExchangePlanContentRules,
})
