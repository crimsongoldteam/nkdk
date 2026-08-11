import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { ExchangePlanContentItemRules, ExchangePlanContentRules } from "./rules"

export type ExchangePlanContentItem = MetadataTypeByRule<typeof ExchangePlanContentItemRules>
export type ExchangePlanContentItemYAML = YAMLTypeByRule<typeof ExchangePlanContentItemRules>

export type ExchangePlanContentItems = ExchangePlanContentItem[]
export type ExchangePlanContentItemsYAML = ExchangePlanContentItemYAML[]

export type ExchangePlanContent = MetadataTypeByRule<typeof ExchangePlanContentRules>
export type ExchangePlanContentYAML = YAMLTypeByRule<typeof ExchangePlanContentRules>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "ExchangePlanContentItem",
  itemRule: ExchangePlanContentItemRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "ExchangePlanContentItems",
  itemRule: ExchangePlanContentItemRules,
  xmlElement: "Item",
  keyField: "metadata",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})

export const metadataRuleLayer002 = defineMetadataItemRule({
  propertyType: "ExchangePlanContent",
  itemRule: ExchangePlanContentRules,
})
