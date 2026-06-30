import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import type { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import type {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsXML,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import type { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import type { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type * as SE from "~/metadata/systemEnumerations/types"
import type { StandardTabularSectionDescriptionRules } from "./rules"

export type StandardTabularSectionDescription = MetadataTypeByRule<typeof StandardTabularSectionDescriptionRules>
export type StandardTabularSectionDescriptionYAML = YAMLTypeByRule<typeof StandardTabularSectionDescriptionRules>

export type StandardTabularSectionDescriptions = StandardTabularSectionDescription[]
export interface StandardTabularSectionDescriptionXML {
  _name: string
  "xr:Synonym"?: I8nTextXML
  "xr:Comment"?: string
  "xr:ToolTip"?: I8nTextXML
  "xr:FillChecking"?: SE.FillChecking
  "xr:StandardAttributes"?: StandardAttributeDescriptionsXML
}
export type StandardTabularSectionDescriptionsXML = {
  "xr:StandardTabularSection": StandardTabularSectionDescriptionXML | StandardTabularSectionDescriptionXML[]
}

export const StandardTabularSectionDescriptionsJSONSchema = Type.Record(Type.String(), Type.Any())
export type StandardTabularSectionDescriptionsYAML = Record<string, StandardTabularSectionDescriptionYAML>

export type StandardTabularSectionAttributeDescriptions = StandardAttributeDescriptions
export type StandardTabularSectionAttributeDescriptionsYAML = StandardAttributeDescriptionsYAML

export interface StandardTabularSectionDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "StandardTabularSectionDescriptions"
}

export type StandardTabularSectionDescriptionsRuleParams = Omit<
  StandardTabularSectionDescriptionsWidePropertyRule,
  "type"
>

export function standardTabularSectionDescriptionsRule<
  const Params extends StandardTabularSectionDescriptionsRuleParams,
>(
  params: WideExactRuleParams<StandardTabularSectionDescriptionsRuleParams, Params>
): Readonly<{ type: "StandardTabularSectionDescriptions" } & Params> {
  return defineWidePropertyRule("StandardTabularSectionDescriptions", params)
}
export interface StandardTabularSectionAttributeDescriptionsWidePropertyRule extends WidePropertyRuleBase {
  type: "StandardTabularSectionAttributeDescriptions"
}

export type StandardTabularSectionAttributeDescriptionsRuleParams = Omit<
  StandardTabularSectionAttributeDescriptionsWidePropertyRule,
  "type"
>

export function standardTabularSectionAttributeDescriptionsRule<
  const Params extends StandardTabularSectionAttributeDescriptionsRuleParams,
>(
  params: WideExactRuleParams<StandardTabularSectionAttributeDescriptionsRuleParams, Params>
): Readonly<{ type: "StandardTabularSectionAttributeDescriptions" } & Params> {
  return defineWidePropertyRule("StandardTabularSectionAttributeDescriptions", params)
}
