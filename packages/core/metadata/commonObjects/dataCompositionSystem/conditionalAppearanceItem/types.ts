import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { ConditionalAppearanceItemRules } from "./rules"

export type ConditionalAppearanceItem = MetadataTypeByRule<typeof ConditionalAppearanceItemRules>

export type ConditionalAppearanceItemYAML = YAMLTypeByRule<typeof ConditionalAppearanceItemRules>

/** Коллекция элементов условного оформления в YAML. */
export type ConditionalAppearanceItemsYAML = ConditionalAppearanceItemYAML[]

export type ConditionalAppearanceItems = ConditionalAppearanceItem[]

registerMetadataItemCollectionRule({
  propertyType: "ConditionalAppearanceItems",
  itemRule: ConditionalAppearanceItemRules,
  xmlElement: "dcsset:item",
  yamlAsArray: true,
})

export interface FilterWidePropertyRule extends WidePropertyRuleBase {
  type: "Filter"
}

export type FilterRuleParams = Omit<FilterWidePropertyRule, "type">

export function filterRule<const Params extends FilterRuleParams>(
  params: WideExactRuleParams<FilterRuleParams, Params>
): Readonly<{ type: "Filter" } & Params> {
  return defineWidePropertyRule("Filter", params)
}
