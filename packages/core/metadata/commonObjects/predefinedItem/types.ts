import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
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

export interface PredefinedItemCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "PredefinedItemCollection"
}

export type PredefinedItemCollectionRuleParams = Omit<PredefinedItemCollectionWidePropertyRule, "type">

export function predefinedItemCollectionRule<const Params extends PredefinedItemCollectionRuleParams>(
  params: WideExactRuleParams<PredefinedItemCollectionRuleParams, Params>
): Readonly<{ type: "PredefinedItemCollection" } & Params> {
  return defineWidePropertyRule("PredefinedItemCollection", params)
}
