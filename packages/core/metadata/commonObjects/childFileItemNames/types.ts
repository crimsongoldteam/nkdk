import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export interface ChildFileItemNamesPropertyRule extends BasePropertyRule {
  type: "ChildFileItemNames"
  xml: string
  forReferenceOnly: true
}

export interface ChildFileItemNamesWidePropertyRule extends WidePropertyRuleBase {
  type: "ChildFileItemNames"
}

export type ChildFileItemNamesRuleParams = Omit<ChildFileItemNamesWidePropertyRule, "type">

export function childFileItemNamesRule<const Params extends ChildFileItemNamesRuleParams>(
  params: WideExactRuleParams<ChildFileItemNamesRuleParams, Params>
): Readonly<{ type: "ChildFileItemNames" } & Params> {
  return defineWidePropertyRule("ChildFileItemNames", params)
}
