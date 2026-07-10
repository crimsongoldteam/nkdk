import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import * as SE from "../../systemEnumerations/types"

export interface CommonAttributeContentItem {
  metadata: string
  use: SE.CommonAttributeUse
  conditionalSeparation?: string
}

export type CommonAttributeContent = CommonAttributeContentItem[]

export interface CommonAttributeContentItemXML {
  "xr:Metadata": string
  "xr:Use": SE.CommonAttributeUse
  "xr:ConditionalSeparation"?: string
}

export interface CommonAttributeContentXML {
  "xr:Item"?: CommonAttributeContentItemXML | CommonAttributeContentItemXML[]
}

export interface CommonAttributeContentItemYAML {
  Объект: string
  Использование: SE.CommonAttributeUseYAML
  УсловноеРазделение?: string
}

export type CommonAttributeContentYAML = CommonAttributeContentItemYAML[]

export interface CommonAttributeContentWidePropertyRule extends WidePropertyRuleBase {
  type: "CommonAttributeContent"
}

export type CommonAttributeContentRuleParams = Omit<CommonAttributeContentWidePropertyRule, "type">

export function commonAttributeContentRule<const Params extends CommonAttributeContentRuleParams>(
  params: WideExactRuleParams<CommonAttributeContentRuleParams, Params>
): Readonly<{ type: "CommonAttributeContent" } & Params> {
  return defineWidePropertyRule("CommonAttributeContent", params)
}
