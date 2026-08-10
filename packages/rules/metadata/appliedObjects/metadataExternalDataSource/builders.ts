import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export interface MetadataExternalDataSourceFunctionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataExternalDataSourceFunctions"
}

export type MetadataExternalDataSourceFunctionsRuleParams = Omit<
  MetadataExternalDataSourceFunctionsWidePropertyRule,
  "type"
>

export function metadataExternalDataSourceFunctionsRule<
  const Params extends MetadataExternalDataSourceFunctionsRuleParams,
>(
  params: WideExactRuleParams<MetadataExternalDataSourceFunctionsRuleParams, Params>
): Readonly<{ type: "MetadataExternalDataSourceFunctions" } & Params> {
  return defineWidePropertyRule("MetadataExternalDataSourceFunctions", params)
}
