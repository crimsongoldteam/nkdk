import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { BasePropertyRule } from "@nkdk/runtime/rule-kit"

export type ChildSubsystemNames = string[]
export type ChildSubsystemNamesXML = string | string[]
export type ChildSubsystemNamesYAML = string[]

export interface ChildSubsystemNamesPropertyRule extends BasePropertyRule {
  type: "ChildSubsystemNames"
  xml: string
  folderName?: string
}

export interface ChildSubsystemNamesWidePropertyRule extends WidePropertyRuleBase {
  type: "ChildSubsystemNames"
}

export type ChildSubsystemNamesRuleParams = Omit<ChildSubsystemNamesWidePropertyRule, "type">

export function childSubsystemNamesRule<const Params extends ChildSubsystemNamesRuleParams>(
  params: WideExactRuleParams<ChildSubsystemNamesRuleParams, Params>
): Readonly<{ type: "ChildSubsystemNames" } & Params> {
  return defineWidePropertyRule("ChildSubsystemNames", params)
}
