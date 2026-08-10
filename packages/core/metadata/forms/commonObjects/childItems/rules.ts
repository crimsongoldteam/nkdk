import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"

export interface CommandBarChildItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandBarChildItems"
}

export type CommandBarChildItemsRuleParams = Omit<CommandBarChildItemsWidePropertyRule, "type">

export function commandBarChildItemsRule<const Params extends CommandBarChildItemsRuleParams>(
  params: WideExactRuleParams<CommandBarChildItemsRuleParams, Params>
): Readonly<{ type: "CommandBarChildItems" } & Params> {
  return defineWidePropertyRule("CommandBarChildItems", params)
}

export interface GroupChildItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "GroupChildItems"
}

export type GroupChildItemsRuleParams = Omit<GroupChildItemsWidePropertyRule, "type">

export function groupChildItemsRule<const Params extends GroupChildItemsRuleParams>(
  params: WideExactRuleParams<GroupChildItemsRuleParams, Params>
): Readonly<{ type: "GroupChildItems" } & Params> {
  return defineWidePropertyRule("GroupChildItems", params)
}

export interface PagesChildItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "PagesChildItems"
}

export type PagesChildItemsRuleParams = Omit<PagesChildItemsWidePropertyRule, "type">

export function pagesChildItemsRule<const Params extends PagesChildItemsRuleParams>(
  params: WideExactRuleParams<PagesChildItemsRuleParams, Params>
): Readonly<{ type: "PagesChildItems" } & Params> {
  return defineWidePropertyRule("PagesChildItems", params)
}

export interface TableChildItemsWidePropertyRule extends WidePropertyRuleBase {
  type: "TableChildItems"
}

export type TableChildItemsRuleParams = Omit<TableChildItemsWidePropertyRule, "type">

export function tableChildItemsRule<const Params extends TableChildItemsRuleParams>(
  params: WideExactRuleParams<TableChildItemsRuleParams, Params>
): Readonly<{ type: "TableChildItems" } & Params> {
  return defineWidePropertyRule("TableChildItems", params)
}
