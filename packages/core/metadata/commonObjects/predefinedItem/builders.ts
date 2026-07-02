import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface PredefinedItemCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "PredefinedItemCollection"
}

export type PredefinedItemCollectionRuleParams = Omit<PredefinedItemCollectionWidePropertyRule, "type">

export function predefinedItemCollectionRule<const Params extends PredefinedItemCollectionRuleParams>(
  params: WideExactRuleParams<PredefinedItemCollectionRuleParams, Params>
): Readonly<{ type: "PredefinedItemCollection" } & Params> {
  return defineWidePropertyRule("PredefinedItemCollection", params)
}
