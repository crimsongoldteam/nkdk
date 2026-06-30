import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
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

export interface ExchangePlanContentItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ExchangePlanContentItems"
}

export type ExchangePlanContentItemsRuleParams = Omit<ExchangePlanContentItemsWidePropertyRule, "type">

export function exchangePlanContentItemsRule<const Params extends ExchangePlanContentItemsRuleParams>(
  params: WideExactRuleParams<ExchangePlanContentItemsRuleParams, Params>
): Readonly<{ type: "ExchangePlanContentItems" } & Params> {
  return defineWidePropertyRule("ExchangePlanContentItems", params)
}
