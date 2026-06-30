import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataIntegrationServiceChannelsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataIntegrationServiceChannels"
}

export type MetadataIntegrationServiceChannelsRuleParams = Omit<
  MetadataIntegrationServiceChannelsWidePropertyRule,
  "type"
>

export function metadataIntegrationServiceChannelsRule<
  const Params extends MetadataIntegrationServiceChannelsRuleParams,
>(
  params: WideExactRuleParams<MetadataIntegrationServiceChannelsRuleParams, Params>
): Readonly<{ type: "MetadataIntegrationServiceChannels" } & Params> {
  return defineWidePropertyRule("MetadataIntegrationServiceChannels", params)
}
