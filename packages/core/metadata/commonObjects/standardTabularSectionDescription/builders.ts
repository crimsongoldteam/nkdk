import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface StandardTabularSectionDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "StandardTabularSectionDescriptions"
}

export type StandardTabularSectionDescriptionsRuleParams = Omit<
  StandardTabularSectionDescriptionsWidePropertyRule,
  "type"
>

export function standardTabularSectionDescriptionsRule<
  const Params extends StandardTabularSectionDescriptionsRuleParams,
>(
  params: WideExactRuleParams<StandardTabularSectionDescriptionsRuleParams, Params>
): Readonly<{ type: "StandardTabularSectionDescriptions" } & Params> {
  return defineWidePropertyRule("StandardTabularSectionDescriptions", params)
}
export interface StandardTabularSectionAttributeDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "StandardTabularSectionAttributeDescriptions"
}

export type StandardTabularSectionAttributeDescriptionsRuleParams = Omit<
  StandardTabularSectionAttributeDescriptionsWidePropertyRule,
  "type"
>

export function standardTabularSectionAttributeDescriptionsRule<
  const Params extends StandardTabularSectionAttributeDescriptionsRuleParams,
>(
  params: WideExactRuleParams<StandardTabularSectionAttributeDescriptionsRuleParams, Params>
): Readonly<{ type: "StandardTabularSectionAttributeDescriptions" } & Params> {
  return defineWidePropertyRule("StandardTabularSectionAttributeDescriptions", params)
}
