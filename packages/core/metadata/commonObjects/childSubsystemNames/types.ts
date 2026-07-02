import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import type { BasePropertyRule } from "../../orchestration/property/types"

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
