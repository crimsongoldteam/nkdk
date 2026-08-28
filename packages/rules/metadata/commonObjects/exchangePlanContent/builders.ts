import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export interface ExchangePlanContentItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ExchangePlanContentItems"
}

export type ExchangePlanContentItemsRuleParams = Omit<ExchangePlanContentItemsWidePropertyRule, "type">

export function exchangePlanContentItemsRule<const Params extends ExchangePlanContentItemsRuleParams>(
  params: WideExactRuleParams<ExchangePlanContentItemsRuleParams, Params>
): Readonly<{ type: "ExchangePlanContentItems" } & Params> {
  return defineWidePropertyRule("ExchangePlanContentItems", params)
}

export interface ExchangePlanExtensionPropertyItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "ExchangePlanExtensionPropertyItems"
}

export type ExchangePlanExtensionPropertyItemsRuleParams = Omit<
  ExchangePlanExtensionPropertyItemsWidePropertyRule,
  "type"
>

export function exchangePlanExtensionPropertyItemsRule<
  const Params extends ExchangePlanExtensionPropertyItemsRuleParams,
>(
  params: WideExactRuleParams<ExchangePlanExtensionPropertyItemsRuleParams, Params>,
): Readonly<{ type: "ExchangePlanExtensionPropertyItems" } & Params> {
  return defineWidePropertyRule("ExchangePlanExtensionPropertyItems", params)
}
