import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../ruleRuntime/property/types"
import type { BasePropertyRule } from "../../ruleRuntime"

export type ExternalFile = true
export type ExternalFileYAML = true

export interface ExternalFilePropertyRule extends BasePropertyRule {
  type: "ExternalFile"
  nkdkPath: string
  xmlPath: string
  syncExternalOnly: true
}

export interface ExternalFileWidePropertyRule extends WidePropertyRuleBase {
  type: "ExternalFile"
}

export type ExternalFileRuleParams = Omit<ExternalFileWidePropertyRule, "type">

export function externalFileRule<const Params extends ExternalFileRuleParams>(
  params: WideExactRuleParams<ExternalFileRuleParams, Params>
): Readonly<{ type: "ExternalFile" } & Params> {
  return defineWidePropertyRule("ExternalFile", params)
}
