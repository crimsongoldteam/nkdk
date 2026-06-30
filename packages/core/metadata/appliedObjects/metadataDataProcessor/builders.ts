import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataAttributes"
}

export type MetadataAttributesRuleParams = Omit<MetadataAttributesWidePropertyRule, "type">

export function metadataAttributesRule<const Params extends MetadataAttributesRuleParams>(
  params: WideExactRuleParams<MetadataAttributesRuleParams, Params>
): Readonly<{ type: "MetadataAttributes" } & Params> {
  return defineWidePropertyRule("MetadataAttributes", params)
}
export interface MetadataDataProcessorTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataDataProcessorTabularSections"
}

export type MetadataDataProcessorTabularSectionsRuleParams = Omit<
  MetadataDataProcessorTabularSectionsWidePropertyRule,
  "type"
>

export function metadataDataProcessorTabularSectionsRule<
  const Params extends MetadataDataProcessorTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataDataProcessorTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataDataProcessorTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataDataProcessorTabularSections", params)
}
