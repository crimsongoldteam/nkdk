import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import type { StringboolYAML } from "../boolean/types"

export type UserSettingsID = boolean

export type UserSettingIDRef = string

export type UserSettingsIDYAML = StringboolYAML

export type UserSettingsIDXML = string

export interface UserSettingsIDWidePropertyRule extends WidePropertyRuleBase {
  type: "UserSettingsID"
}

export type UserSettingsIDRuleParams = Omit<UserSettingsIDWidePropertyRule, "type">

export function userSettingsIDRule<const Params extends UserSettingsIDRuleParams>(
  params: WideExactRuleParams<UserSettingsIDRuleParams, Params>
): Readonly<{ type: "UserSettingsID" } & Params> {
  return defineWidePropertyRule("UserSettingsID", params)
}
