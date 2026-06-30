import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataEnumerationValuesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataEnumerationValues"
}

export type MetadataEnumerationValuesRuleParams = Omit<MetadataEnumerationValuesWidePropertyRule, "type">

export function metadataEnumerationValuesRule<const Params extends MetadataEnumerationValuesRuleParams>(
  params: WideExactRuleParams<MetadataEnumerationValuesRuleParams, Params>
): Readonly<{ type: "MetadataEnumerationValues" } & Params> {
  return defineWidePropertyRule("MetadataEnumerationValues", params)
}
