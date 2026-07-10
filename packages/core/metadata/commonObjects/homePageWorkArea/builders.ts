import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface HomePageWorkAreaColumnItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkAreaColumnItems"
}

export type HomePageWorkAreaColumnItemsRuleParams = Omit<HomePageWorkAreaColumnItemsWidePropertyRule, "type">

export function homePageWorkAreaColumnItemsRule<const Params extends HomePageWorkAreaColumnItemsRuleParams>(
  params: WideExactRuleParams<HomePageWorkAreaColumnItemsRuleParams, Params>
): Readonly<{ type: "HomePageWorkAreaColumnItems" } & Params> {
  return defineWidePropertyRule("HomePageWorkAreaColumnItems", params)
}
export interface HomePageWorkAreaCommandInterfaceDisplayWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkAreaCommandInterfaceDisplay"
}

export type HomePageWorkAreaCommandInterfaceDisplayRuleParams = Omit<
  HomePageWorkAreaCommandInterfaceDisplayWidePropertyRule,
  "type"
>

export function homePageWorkAreaCommandInterfaceDisplayRule<
  const Params extends HomePageWorkAreaCommandInterfaceDisplayRuleParams,
>(
  params: WideExactRuleParams<HomePageWorkAreaCommandInterfaceDisplayRuleParams, Params>
): Readonly<{ type: "HomePageWorkAreaCommandInterfaceDisplay" } & Params> {
  return defineWidePropertyRule("HomePageWorkAreaCommandInterfaceDisplay", params)
}
export interface HomePageWorkAreaTemplateWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkAreaTemplate"
}

export type HomePageWorkAreaTemplateRuleParams = Omit<HomePageWorkAreaTemplateWidePropertyRule, "type">

export function homePageWorkAreaTemplateRule<const Params extends HomePageWorkAreaTemplateRuleParams>(
  params: WideExactRuleParams<HomePageWorkAreaTemplateRuleParams, Params>
): Readonly<{ type: "HomePageWorkAreaTemplate" } & Params> {
  return defineWidePropertyRule("HomePageWorkAreaTemplate", params)
}
