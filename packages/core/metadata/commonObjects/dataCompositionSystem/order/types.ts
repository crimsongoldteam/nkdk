import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../orderItemFields/types"
import { OrderRules } from "./rules"
import { registerMetadataItemRule } from "~/metadata/orchestration"

export type Order = MetadataTypeByRule<typeof OrderRules>
export type OrderYAML = YAMLTypeByRule<typeof OrderRules>

registerMetadataItemRule({
  propertyType: "Order",
  itemRule: OrderRules,
})

export interface OrderItemFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "OrderItemFields"
}

export type OrderItemFieldsRuleParams = Omit<OrderItemFieldsWidePropertyRule, "type">

export function orderItemFieldsRule<const Params extends OrderItemFieldsRuleParams>(
  params: WideExactRuleParams<OrderItemFieldsRuleParams, Params>
): Readonly<{ type: "OrderItemFields" } & Params> {
  return defineWidePropertyRule("OrderItemFields", params)
}
