import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataHTTPServiceURLTemplatesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataHTTPServiceURLTemplates"
}

export type MetadataHTTPServiceURLTemplatesRuleParams = Omit<MetadataHTTPServiceURLTemplatesWidePropertyRule, "type">

export function metadataHTTPServiceURLTemplatesRule<const Params extends MetadataHTTPServiceURLTemplatesRuleParams>(
  params: WideExactRuleParams<MetadataHTTPServiceURLTemplatesRuleParams, Params>
): Readonly<{ type: "MetadataHTTPServiceURLTemplates" } & Params> {
  return defineWidePropertyRule("MetadataHTTPServiceURLTemplates", params)
}
