import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface StandardAttributeDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "StandardAttributeDescriptions"
}

export type StandardAttributeDescriptionsRuleParams = Omit<StandardAttributeDescriptionsWidePropertyRule, "type">

export function standardAttributeDescriptionsRule<const Params extends StandardAttributeDescriptionsRuleParams>(
  params: WideExactRuleParams<StandardAttributeDescriptionsRuleParams, Params>
): Readonly<{ type: "StandardAttributeDescriptions"; ownerFactRole: "standardAttributes" } & Params> {
  return defineWidePropertyRule("StandardAttributeDescriptions", {
    ownerFactRole: "standardAttributes",
    configurationIndexUidSegment: "СтандартныйРеквизит",
    ...params,
  })
}
