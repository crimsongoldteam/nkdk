import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface StandardAttributeDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "StandardAttributeDescriptions"
}

export type StandardAttributeDescriptionsRuleParams = Omit<StandardAttributeDescriptionsWidePropertyRule, "type">

export function standardAttributeDescriptionsRule<const Params extends StandardAttributeDescriptionsRuleParams>(
  params: WideExactRuleParams<StandardAttributeDescriptionsRuleParams, Params>
): Readonly<{ type: "StandardAttributeDescriptions" } & Params> {
  return defineWidePropertyRule("StandardAttributeDescriptions", params)
}
