import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface MetadataCatalogAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataCatalogAttributes"
}

export type MetadataCatalogAttributesRuleParams = Omit<MetadataCatalogAttributesWidePropertyRule, "type">

export function metadataCatalogAttributesRule<const Params extends MetadataCatalogAttributesRuleParams>(
  params: WideExactRuleParams<MetadataCatalogAttributesRuleParams, Params>
): Readonly<{ type: "MetadataCatalogAttributes" } & Params> {
  return defineWidePropertyRule("MetadataCatalogAttributes", params)
}
export interface MetadataTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataTabularSections"
}

export type MetadataTabularSectionsRuleParams = Omit<MetadataTabularSectionsWidePropertyRule, "type">

export function metadataTabularSectionsRule<const Params extends MetadataTabularSectionsRuleParams>(
  params: WideExactRuleParams<MetadataTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataTabularSections", params)
}
