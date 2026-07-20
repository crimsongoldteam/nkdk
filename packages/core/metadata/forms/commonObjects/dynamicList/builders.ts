import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"

export interface CalculatedFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "CalculatedFields"
}

export type CalculatedFieldsRuleParams = Omit<CalculatedFieldsWidePropertyRule, "type">

export function calculatedFieldsRule<const Params extends CalculatedFieldsRuleParams>(
  params: WideExactRuleParams<CalculatedFieldsRuleParams, Params>
): Readonly<{ type: "CalculatedFields" } & Params> {
  return defineWidePropertyRule("CalculatedFields", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
export interface DataSetFieldFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "DataSetFieldFields"
}

export type DataSetFieldFieldsRuleParams = Omit<DataSetFieldFieldsWidePropertyRule, "type">

export function dataSetFieldFieldsRule<const Params extends DataSetFieldFieldsRuleParams>(
  params: WideExactRuleParams<DataSetFieldFieldsRuleParams, Params>
): Readonly<{ type: "DataSetFieldFields" } & Params> {
  return defineWidePropertyRule("DataSetFieldFields", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
export interface DCSParametersWidePropertyRule extends WidePropertyRuleBase {
  type: "DCSParameters"
}

export type DCSParametersRuleParams = Omit<DCSParametersWidePropertyRule, "type">

export function dCSParametersRule<const Params extends DCSParametersRuleParams>(
  params: WideExactRuleParams<DCSParametersRuleParams, Params>
): Readonly<{ type: "DCSParameters" } & Params> {
  return defineWidePropertyRule("DCSParameters", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
export interface DynamicListKeyFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "DynamicListKeyFields"
}

export type DynamicListKeyFieldsRuleParams = Omit<DynamicListKeyFieldsWidePropertyRule, "type">

export function dynamicListKeyFieldsRule<const Params extends DynamicListKeyFieldsRuleParams>(
  params: WideExactRuleParams<DynamicListKeyFieldsRuleParams, Params>
): Readonly<{ type: "DynamicListKeyFields" } & Params> {
  return defineWidePropertyRule("DynamicListKeyFields", params)
}
export interface OrderWidePropertyRule extends WidePropertyRuleBase {
  type: "Order"
}

export type OrderRuleParams = Omit<OrderWidePropertyRule, "type">

export function orderRule<const Params extends OrderRuleParams>(
  params: WideExactRuleParams<OrderRuleParams, Params>
): Readonly<{ type: "Order" } & Params> {
  return defineWidePropertyRule("Order", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
