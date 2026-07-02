import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"

export interface CommandInterfaceCommandGroupsWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceCommandGroups"
}

export type CommandInterfaceCommandGroupsRuleParams = Omit<CommandInterfaceCommandGroupsWidePropertyRule, "type">

export function commandInterfaceCommandGroupsRule<const Params extends CommandInterfaceCommandGroupsRuleParams>(
  params: WideExactRuleParams<CommandInterfaceCommandGroupsRuleParams, Params>
): Readonly<{ type: "CommandInterfaceCommandGroups" } & Params> {
  return defineWidePropertyRule("CommandInterfaceCommandGroups", params)
}
export interface CommandInterfaceOrderWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceOrder"
}

export type CommandInterfaceOrderRuleParams = Omit<CommandInterfaceOrderWidePropertyRule, "type">

export function commandInterfaceOrderRule<const Params extends CommandInterfaceOrderRuleParams>(
  params: WideExactRuleParams<CommandInterfaceOrderRuleParams, Params>
): Readonly<{ type: "CommandInterfaceOrder" } & Params> {
  return defineWidePropertyRule("CommandInterfaceOrder", params)
}
export interface CommandInterfacePlacementMapWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfacePlacementMap"
}

export type CommandInterfacePlacementMapRuleParams = Omit<CommandInterfacePlacementMapWidePropertyRule, "type">

export function commandInterfacePlacementMapRule<const Params extends CommandInterfacePlacementMapRuleParams>(
  params: WideExactRuleParams<CommandInterfacePlacementMapRuleParams, Params>
): Readonly<{ type: "CommandInterfacePlacementMap" } & Params> {
  return defineWidePropertyRule("CommandInterfacePlacementMap", params)
}
export interface CommandInterfaceSubsystemsOrderWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceSubsystemsOrder"
}

export type CommandInterfaceSubsystemsOrderRuleParams = Omit<CommandInterfaceSubsystemsOrderWidePropertyRule, "type">

export function commandInterfaceSubsystemsOrderRule<const Params extends CommandInterfaceSubsystemsOrderRuleParams>(
  params: WideExactRuleParams<CommandInterfaceSubsystemsOrderRuleParams, Params>
): Readonly<{ type: "CommandInterfaceSubsystemsOrder" } & Params> {
  return defineWidePropertyRule("CommandInterfaceSubsystemsOrder", params)
}
export interface CommandInterfaceSubsystemsVisibilityMapWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceSubsystemsVisibilityMap"
}

export type CommandInterfaceSubsystemsVisibilityMapRuleParams = Omit<
  CommandInterfaceSubsystemsVisibilityMapWidePropertyRule,
  "type"
>

export function commandInterfaceSubsystemsVisibilityMapRule<
  const Params extends CommandInterfaceSubsystemsVisibilityMapRuleParams,
>(
  params: WideExactRuleParams<CommandInterfaceSubsystemsVisibilityMapRuleParams, Params>
): Readonly<{ type: "CommandInterfaceSubsystemsVisibilityMap" } & Params> {
  return defineWidePropertyRule("CommandInterfaceSubsystemsVisibilityMap", params)
}
export interface CommandInterfaceVisibilityMapWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandInterfaceVisibilityMap"
}

export type CommandInterfaceVisibilityMapRuleParams = Omit<CommandInterfaceVisibilityMapWidePropertyRule, "type">

export function commandInterfaceVisibilityMapRule<const Params extends CommandInterfaceVisibilityMapRuleParams>(
  params: WideExactRuleParams<CommandInterfaceVisibilityMapRuleParams, Params>
): Readonly<{ type: "CommandInterfaceVisibilityMap" } & Params> {
  return defineWidePropertyRule("CommandInterfaceVisibilityMap", params)
}
