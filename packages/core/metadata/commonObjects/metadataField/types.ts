import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Static, Type } from "@sinclair/typebox"

export type MetadataField = string

export type MetadataFieldXML = string

export const MetadataFieldJSONSchema = Type.String()
export type MetadataFieldYAML = Static<typeof MetadataFieldJSONSchema>

export type MetadataFields = MetadataField[]
export type MetadataFieldsXML = {
  "xr:Field": MetadataFieldXML | MetadataFieldXML[]
}
export type MetadataFieldsYAML = MetadataFieldYAML[]

export interface MetadataFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataFields"
}

export type MetadataFieldsRuleParams = Omit<MetadataFieldsWidePropertyRule, "type">

export function metadataFieldsRule<const Params extends MetadataFieldsRuleParams>(
  params: WideExactRuleParams<MetadataFieldsRuleParams, Params>
): Readonly<{ type: "MetadataFields" } & Params> {
  return defineWidePropertyRule("MetadataFields", params)
}
