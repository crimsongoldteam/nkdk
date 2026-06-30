import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface StructureItemGroupWidePropertyRule extends WidePropertyRuleBase {
  type: "StructureItemGroup"
}

export type StructureItemGroupRuleParams = Omit<StructureItemGroupWidePropertyRule, "type">

export function structureItemGroupRule<const Params extends StructureItemGroupRuleParams>(
  params: WideExactRuleParams<StructureItemGroupRuleParams, Params>
): Readonly<{ type: "StructureItemGroup" } & Params> {
  return defineWidePropertyRule("StructureItemGroup", params)
}
