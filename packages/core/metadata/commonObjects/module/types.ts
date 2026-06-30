import { definePropertyRule, type ExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { ModulePropertyRule } from "~/metadata/orchestration/property/types"

export type ModuleRuleParams = Omit<ModulePropertyRule, "type">

export function moduleRule<const Params extends ModuleRuleParams>(
  params: ExactRuleParams<ModuleRuleParams, Params>
): Readonly<{ type: "Module" } & Params> {
  return definePropertyRule("Module", params)
}
