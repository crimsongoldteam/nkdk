import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import type { StringboolYAML } from "../boolean/types"

export type UserSettingIDRef = string

export type UserSettingsID = boolean | UserSettingIDRef

export type UserSettingsIDYAML = StringboolYAML | UserSettingIDRef

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
