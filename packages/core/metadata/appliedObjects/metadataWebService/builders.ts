import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataWebServiceOperationsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataWebServiceOperations"
}

export type MetadataWebServiceOperationsRuleParams = Omit<MetadataWebServiceOperationsWidePropertyRule, "type">

export function metadataWebServiceOperationsRule<const Params extends MetadataWebServiceOperationsRuleParams>(
  params: WideExactRuleParams<MetadataWebServiceOperationsRuleParams, Params>
): Readonly<{ type: "MetadataWebServiceOperations" } & Params> {
  return defineWidePropertyRule("MetadataWebServiceOperations", params)
}
