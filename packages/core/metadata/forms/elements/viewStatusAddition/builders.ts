import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"

export interface ContextMenuWidePropertyRule extends WidePropertyRuleBase {
  type: "ContextMenu"
}

export type ContextMenuRuleParams = Omit<ContextMenuWidePropertyRule, "type">

export function contextMenuRule<const Params extends ContextMenuRuleParams>(
  params: WideExactRuleParams<ContextMenuRuleParams, Params>
): Readonly<{ type: "ContextMenu" } & Params> {
  return defineWidePropertyRule("ContextMenu", params)
}
export interface ExtendedTooltipWidePropertyRule extends WidePropertyRuleBase {
  type: "ExtendedTooltip"
}

export type ExtendedTooltipRuleParams = Omit<ExtendedTooltipWidePropertyRule, "type">

export function extendedTooltipRule<const Params extends ExtendedTooltipRuleParams>(
  params: WideExactRuleParams<ExtendedTooltipRuleParams, Params>
): Readonly<{ type: "ExtendedTooltip" } & Params> {
  return defineWidePropertyRule("ExtendedTooltip", params)
}
