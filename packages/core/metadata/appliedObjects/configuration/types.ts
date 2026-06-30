import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataConfigurationRules } from "./rules"

export type MetadataConfiguration = MetadataTypeByRule<typeof MetadataConfigurationRules>
export type MetadataConfigurationYAML = YAMLTypeByRule<typeof MetadataConfigurationRules>

export interface RootCommandInterfaceWidePropertyRule extends WidePropertyRuleBase {
  type: "RootCommandInterface"
}

export type RootCommandInterfaceRuleParams = Omit<RootCommandInterfaceWidePropertyRule, "type">

export function rootCommandInterfaceRule<const Params extends RootCommandInterfaceRuleParams>(
  params: WideExactRuleParams<RootCommandInterfaceRuleParams, Params>
): Readonly<{ type: "RootCommandInterface" } & Params> {
  return defineWidePropertyRule("RootCommandInterface", params)
}
export interface AllowedIncomingShareRequestTypesWidePropertyRule extends WidePropertyRuleBase {
  type: "AllowedIncomingShareRequestTypes"
}

export type AllowedIncomingShareRequestTypesRuleParams = Omit<AllowedIncomingShareRequestTypesWidePropertyRule, "type">

export function allowedIncomingShareRequestTypesRule<const Params extends AllowedIncomingShareRequestTypesRuleParams>(
  params: WideExactRuleParams<AllowedIncomingShareRequestTypesRuleParams, Params>
): Readonly<{ type: "AllowedIncomingShareRequestTypes" } & Params> {
  return defineWidePropertyRule("AllowedIncomingShareRequestTypes", params)
}
export interface ClientApplicationInterfaceWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationInterface"
}

export type ClientApplicationInterfaceRuleParams = Omit<ClientApplicationInterfaceWidePropertyRule, "type">

export function clientApplicationInterfaceRule<const Params extends ClientApplicationInterfaceRuleParams>(
  params: WideExactRuleParams<ClientApplicationInterfaceRuleParams, Params>
): Readonly<{ type: "ClientApplicationInterface" } & Params> {
  return defineWidePropertyRule("ClientApplicationInterface", params)
}
export interface HomePageWorkAreaWidePropertyRule extends WidePropertyRuleBase {
  type: "HomePageWorkArea"
}

export type HomePageWorkAreaRuleParams = Omit<HomePageWorkAreaWidePropertyRule, "type">

export function homePageWorkAreaRule<const Params extends HomePageWorkAreaRuleParams>(
  params: WideExactRuleParams<HomePageWorkAreaRuleParams, Params>
): Readonly<{ type: "HomePageWorkArea" } & Params> {
  return defineWidePropertyRule("HomePageWorkArea", params)
}
export interface MobileApplicationURLsWidePropertyRule extends WidePropertyRuleBase {
  type: "MobileApplicationURLs"
}

export type MobileApplicationURLsRuleParams = Omit<MobileApplicationURLsWidePropertyRule, "type">

export function mobileApplicationURLsRule<const Params extends MobileApplicationURLsRuleParams>(
  params: WideExactRuleParams<MobileApplicationURLsRuleParams, Params>
): Readonly<{ type: "MobileApplicationURLs" } & Params> {
  return defineWidePropertyRule("MobileApplicationURLs", params)
}
export interface UsedMobileApplicationFunctionalitiesWidePropertyRule extends WidePropertyRuleBase {
  type: "UsedMobileApplicationFunctionalities"
}

export type UsedMobileApplicationFunctionalitiesRuleParams = Omit<
  UsedMobileApplicationFunctionalitiesWidePropertyRule,
  "type"
>

export function usedMobileApplicationFunctionalitiesRule<
  const Params extends UsedMobileApplicationFunctionalitiesRuleParams,
>(
  params: WideExactRuleParams<UsedMobileApplicationFunctionalitiesRuleParams, Params>
): Readonly<{ type: "UsedMobileApplicationFunctionalities" } & Params> {
  return defineWidePropertyRule("UsedMobileApplicationFunctionalities", params)
}
