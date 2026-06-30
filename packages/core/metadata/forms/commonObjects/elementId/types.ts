import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface ElementIdWidePropertyRule extends WidePropertyRuleBase {
  type: "ElementId"
}

export type ElementIdRuleParams = Omit<ElementIdWidePropertyRule, "type">

export function elementIdRule<const Params extends ElementIdRuleParams>(
  params: WideExactRuleParams<ElementIdRuleParams, Params>
): Readonly<{ type: "ElementId" } & Params> {
  return defineWidePropertyRule("ElementId", params)
}
