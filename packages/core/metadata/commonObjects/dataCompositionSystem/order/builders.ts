import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface OrderItemFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "OrderItemFields"
}

export type OrderItemFieldsRuleParams = Omit<OrderItemFieldsWidePropertyRule, "type">

export function orderItemFieldsRule<const Params extends OrderItemFieldsRuleParams>(
  params: WideExactRuleParams<OrderItemFieldsRuleParams, Params>
): Readonly<{ type: "OrderItemFields" } & Params> {
  return defineWidePropertyRule("OrderItemFields", params)
}
