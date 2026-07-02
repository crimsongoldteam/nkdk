import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import type { BasePropertyRule } from "../../orchestration"

export type ExternalPicture = true
export type ExternalPictureYAML = true

export interface ExternalPicturePropertyRule extends BasePropertyRule {
  type: "ExternalPicture"
  nkdkDir: string
  xmlPath: string
  payloadXmlDir: string
  toXML?: false
  fromXML?: false
}

export interface ExternalPictureWidePropertyRule extends WidePropertyRuleBase {
  type: "ExternalPicture"
}

export type ExternalPictureRuleParams = Omit<ExternalPictureWidePropertyRule, "type">

export function externalPictureRule<const Params extends ExternalPictureRuleParams>(
  params: WideExactRuleParams<ExternalPictureRuleParams, Params>
): Readonly<{ type: "ExternalPicture" } & Params> {
  return defineWidePropertyRule("ExternalPicture", params)
}
