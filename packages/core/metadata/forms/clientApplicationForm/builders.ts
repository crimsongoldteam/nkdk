import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface ExternalFormItemFileWidePropertyRule extends WidePropertyRuleBase {
  type: "ExternalFormItemFile"
}

export type ExternalFormItemFileRuleParams = Omit<ExternalFormItemFileWidePropertyRule, "type">

export function externalFormItemFileRule<const Params extends ExternalFormItemFileRuleParams>(
  params: WideExactRuleParams<ExternalFormItemFileRuleParams, Params>
): Readonly<{ type: "ExternalFormItemFile" } & Params> {
  return defineWidePropertyRule("ExternalFormItemFile", params)
}
export interface ConditionalAppearanceWidePropertyRule extends WidePropertyRuleBase {
  type: "ConditionalAppearance"
}

export type ConditionalAppearanceRuleParams = Omit<ConditionalAppearanceWidePropertyRule, "type">

export function conditionalAppearanceRule<const Params extends ConditionalAppearanceRuleParams>(
  params: WideExactRuleParams<ConditionalAppearanceRuleParams, Params>
): Readonly<{ type: "ConditionalAppearance" } & Params> {
  return defineWidePropertyRule("ConditionalAppearance", params)
}
export interface AutoCommandBarWidePropertyRule extends WidePropertyRuleBase {
  type: "AutoCommandBar"
}

export type AutoCommandBarRuleParams = Omit<AutoCommandBarWidePropertyRule, "type">

export function autoCommandBarRule<const Params extends AutoCommandBarRuleParams>(
  params: WideExactRuleParams<AutoCommandBarRuleParams, Params>
): Readonly<{ type: "AutoCommandBar" } & Params> {
  return defineWidePropertyRule("AutoCommandBar", params)
}
export interface ClientApplicationFormWidePropertyRule extends WidePropertyRuleBase {
  type: "ClientApplicationForm"
}

export type ClientApplicationFormRuleParams = Omit<ClientApplicationFormWidePropertyRule, "type">

export function clientApplicationFormRule<const Params extends ClientApplicationFormRuleParams>(
  params: WideExactRuleParams<ClientApplicationFormRuleParams, Params>
): Readonly<{ type: "ClientApplicationForm" } & Params> {
  return defineWidePropertyRule("ClientApplicationForm", params)
}
