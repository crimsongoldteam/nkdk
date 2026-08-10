import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export interface AppearanceFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "AppearanceFields"
}

export type AppearanceFieldsRuleParams = Omit<AppearanceFieldsWidePropertyRule, "type">

export function appearanceFieldsRule<const Params extends AppearanceFieldsRuleParams>(
  params: WideExactRuleParams<AppearanceFieldsRuleParams, Params>
): Readonly<{ type: "AppearanceFields" } & Params> {
  return defineWidePropertyRule("AppearanceFields", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
