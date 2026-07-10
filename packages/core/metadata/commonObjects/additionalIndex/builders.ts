import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface AdditionalIndexCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "AdditionalIndexCollection"
}

export type AdditionalIndexCollectionRuleParams = Omit<AdditionalIndexCollectionWidePropertyRule, "type">

export function additionalIndexCollectionRule<const Params extends AdditionalIndexCollectionRuleParams>(
  params: WideExactRuleParams<AdditionalIndexCollectionRuleParams, Params>
): Readonly<{ type: "AdditionalIndexCollection" } & Params> {
  return defineWidePropertyRule("AdditionalIndexCollection", params)
}
