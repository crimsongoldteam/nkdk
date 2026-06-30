import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataAccumulationRegisterRules } from "./rules"

export type MetadataAccumulationRegister = MetadataTypeByRule<typeof MetadataAccumulationRegisterRules>
export type MetadataAccumulationRegisterYAML = YAMLTypeByRule<typeof MetadataAccumulationRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccumulationRegister",
  itemRule: MetadataAccumulationRegisterRules,
})

export interface AccumulationRegisterAggregatesWidePropertyRule extends WidePropertyRuleBase {
  type: "AccumulationRegisterAggregates"
}

export type AccumulationRegisterAggregatesRuleParams = Omit<AccumulationRegisterAggregatesWidePropertyRule, "type">

export function accumulationRegisterAggregatesRule<const Params extends AccumulationRegisterAggregatesRuleParams>(
  params: WideExactRuleParams<AccumulationRegisterAggregatesRuleParams, Params>
): Readonly<{ type: "AccumulationRegisterAggregates" } & Params> {
  return defineWidePropertyRule("AccumulationRegisterAggregates", params)
}
