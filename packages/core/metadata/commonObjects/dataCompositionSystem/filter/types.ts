import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../filterItem/types"
import { FilterRules } from "./rules"
import { registerMetadataItemRule } from "~/metadata/orchestration"

export type Filter = MetadataTypeByRule<typeof FilterRules>

export type FilterYAML = YAMLTypeByRule<typeof FilterRules>

registerMetadataItemRule({
  propertyType: "Filter",
  itemRule: FilterRules,
})

export interface FilterItemWidePropertyRule extends WidePropertyRuleBase {
  type: "FilterItem"
}

export type FilterItemRuleParams = Omit<FilterItemWidePropertyRule, "type">

export function filterItemRule<const Params extends FilterItemRuleParams>(
  params: WideExactRuleParams<FilterItemRuleParams, Params>
): Readonly<{ type: "FilterItem" } & Params> {
  return defineWidePropertyRule("FilterItem", params)
}
