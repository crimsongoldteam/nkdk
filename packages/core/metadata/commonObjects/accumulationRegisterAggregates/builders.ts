import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface AccumulationRegisterAggregateCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "AccumulationRegisterAggregateCollection"
}

export type AccumulationRegisterAggregateCollectionRuleParams = Omit<
  AccumulationRegisterAggregateCollectionWidePropertyRule,
  "type"
>

export function accumulationRegisterAggregateCollectionRule<
  const Params extends AccumulationRegisterAggregateCollectionRuleParams,
>(
  params: WideExactRuleParams<AccumulationRegisterAggregateCollectionRuleParams, Params>
): Readonly<{ type: "AccumulationRegisterAggregateCollection" } & Params> {
  return defineWidePropertyRule("AccumulationRegisterAggregateCollection", params)
}
export interface AccumulationRegisterAggregateDimensionsWidePropertyRule extends WidePropertyRuleBase {
  type: "AccumulationRegisterAggregateDimensions"
}

export type AccumulationRegisterAggregateDimensionsRuleParams = Omit<
  AccumulationRegisterAggregateDimensionsWidePropertyRule,
  "type"
>

export function accumulationRegisterAggregateDimensionsRule<
  const Params extends AccumulationRegisterAggregateDimensionsRuleParams,
>(
  params: WideExactRuleParams<AccumulationRegisterAggregateDimensionsRuleParams, Params>
): Readonly<{ type: "AccumulationRegisterAggregateDimensions" } & Params> {
  return defineWidePropertyRule("AccumulationRegisterAggregateDimensions", params)
}
