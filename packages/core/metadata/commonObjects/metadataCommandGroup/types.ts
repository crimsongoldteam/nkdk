import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
export type MetadataCommandGroup = string

export interface MetadataCommandGroupXML {
  "xsi:type": "xr:MDObjectRef"
  "#text": string
}

export type MetadataCommandGroupYAML = string

export interface MetadataCommandGroupWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataCommandGroup"
}

export type MetadataCommandGroupRuleParams = Omit<MetadataCommandGroupWidePropertyRule, "type">

export function metadataCommandGroupRule<const Params extends MetadataCommandGroupRuleParams>(
  params: WideExactRuleParams<MetadataCommandGroupRuleParams, Params>
): Readonly<{ type: "MetadataCommandGroup" } & Params> {
  return defineWidePropertyRule("MetadataCommandGroup", params)
}
