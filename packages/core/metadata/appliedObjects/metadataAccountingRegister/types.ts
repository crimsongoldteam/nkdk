import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataAccountingRegisterRules } from "./rules"

export type MetadataAccountingRegister = MetadataTypeByRule<typeof MetadataAccountingRegisterRules>
export type MetadataAccountingRegisterYAML = YAMLTypeByRule<typeof MetadataAccountingRegisterRules>

registerMetadataItemRule({
  propertyType: "MetadataAccountingRegister",
  itemRule: MetadataAccountingRegisterRules,
})

export interface MetadataCommandsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataCommands"
}

export type MetadataCommandsRuleParams = Omit<MetadataCommandsWidePropertyRule, "type">

export function metadataCommandsRule<const Params extends MetadataCommandsRuleParams>(
  params: WideExactRuleParams<MetadataCommandsRuleParams, Params>
): Readonly<{ type: "MetadataCommands" } & Params> {
  return defineWidePropertyRule("MetadataCommands", params)
}
export interface AdditionalIndexWidePropertyRule extends WidePropertyRuleBase {
  type: "AdditionalIndex"
}

export type AdditionalIndexRuleParams = Omit<AdditionalIndexWidePropertyRule, "type">

export function additionalIndexRule<const Params extends AdditionalIndexRuleParams>(
  params: WideExactRuleParams<AdditionalIndexRuleParams, Params>
): Readonly<{ type: "AdditionalIndex" } & Params> {
  return defineWidePropertyRule("AdditionalIndex", params)
}
export interface MetadataRegisterDimensionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterDimensions"
}

export type MetadataRegisterDimensionsRuleParams = Omit<MetadataRegisterDimensionsWidePropertyRule, "type">

export function metadataRegisterDimensionsRule<const Params extends MetadataRegisterDimensionsRuleParams>(
  params: WideExactRuleParams<MetadataRegisterDimensionsRuleParams, Params>
): Readonly<{ type: "MetadataRegisterDimensions" } & Params> {
  return defineWidePropertyRule("MetadataRegisterDimensions", params)
}
export interface MetadataRegisterAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterAttributes"
}

export type MetadataRegisterAttributesRuleParams = Omit<MetadataRegisterAttributesWidePropertyRule, "type">

export function metadataRegisterAttributesRule<const Params extends MetadataRegisterAttributesRuleParams>(
  params: WideExactRuleParams<MetadataRegisterAttributesRuleParams, Params>
): Readonly<{ type: "MetadataRegisterAttributes" } & Params> {
  return defineWidePropertyRule("MetadataRegisterAttributes", params)
}
export interface MetadataRegisterResourcesWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataRegisterResources"
}

export type MetadataRegisterResourcesRuleParams = Omit<MetadataRegisterResourcesWidePropertyRule, "type">

export function metadataRegisterResourcesRule<const Params extends MetadataRegisterResourcesRuleParams>(
  params: WideExactRuleParams<MetadataRegisterResourcesRuleParams, Params>
): Readonly<{ type: "MetadataRegisterResources" } & Params> {
  return defineWidePropertyRule("MetadataRegisterResources", params)
}
