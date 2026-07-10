import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import { definePropertyRule, type ExactRuleParams } from "../ruleBuilder"
import type { ModulePropertyRule } from "../../orchestration/property/types"

export type ModuleRuleParams = Omit<ModulePropertyRule, "type">

export function moduleRule<const Params extends ModuleRuleParams>(
  params: ExactRuleParams<ModuleRuleParams, Params>
): Readonly<{ type: "Module" } & Params> {
  return definePropertyRule("Module", params)
}

export interface TemplateWidePropertyRule extends WidePropertyRuleBase {
  type: "Template"
}

export type TemplateRuleParams = Omit<TemplateWidePropertyRule, "type">

export function templateRule<const Params extends TemplateRuleParams>(
  params: WideExactRuleParams<TemplateRuleParams, Params>
): Readonly<{ type: "Template" } & Params> {
  return defineWidePropertyRule("Template", params)
}
