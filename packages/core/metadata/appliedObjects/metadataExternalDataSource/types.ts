import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceRules } from "./rules"

export type MetadataExternalDataSource = MetadataTypeByRule<typeof MetadataExternalDataSourceRules>
export type MetadataExternalDataSourceYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceRules>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSource",
  itemRule: MetadataExternalDataSourceRules,
})

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
