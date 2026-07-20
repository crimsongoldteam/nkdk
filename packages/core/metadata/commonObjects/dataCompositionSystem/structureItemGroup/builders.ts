import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"

export interface StructureItemGroupWidePropertyRule extends WidePropertyRuleBase {
  type: "StructureItemGroup"
}

export type StructureItemGroupRuleParams = Omit<StructureItemGroupWidePropertyRule, "type">

export function structureItemGroupRule<const Params extends StructureItemGroupRuleParams>(
  params: WideExactRuleParams<StructureItemGroupRuleParams, Params>
): Readonly<{ type: "StructureItemGroup" } & Params> {
  return defineWidePropertyRule("StructureItemGroup", {
    configurationIndexAddressing: "yamlPath" as const,
    ...params,
  })
}
