import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataChartOfAccountsAttributeRules,
  MetadataChartOfAccountsTabularSectionRules,
} from "./childRules"

export interface AccountingFlagsWidePropertyRule extends WidePropertyRuleBase {
  type: "AccountingFlags"
}

export type AccountingFlagsRuleParams = Omit<AccountingFlagsWidePropertyRule, "type">

export function accountingFlagsRule<const Params extends AccountingFlagsRuleParams>(
  params: WideExactRuleParams<AccountingFlagsRuleParams, Params>
): Readonly<{ type: "AccountingFlags" } & Params> {
  return defineWidePropertyRule("AccountingFlags", params)
}
export interface ExtDimensionAccountingFlagsWidePropertyRule extends WidePropertyRuleBase {
  type: "ExtDimensionAccountingFlags"
}

export type ExtDimensionAccountingFlagsRuleParams = Omit<ExtDimensionAccountingFlagsWidePropertyRule, "type">

export function extDimensionAccountingFlagsRule<const Params extends ExtDimensionAccountingFlagsRuleParams>(
  params: WideExactRuleParams<ExtDimensionAccountingFlagsRuleParams, Params>
): Readonly<{ type: "ExtDimensionAccountingFlags" } & Params> {
  return defineWidePropertyRule("ExtDimensionAccountingFlags", params)
}
export interface ChartOfAccountsPredefinedAccountingFlagsWidePropertyRule extends WidePropertyRuleBase {
  type: "ChartOfAccountsPredefinedAccountingFlags"
}

export type ChartOfAccountsPredefinedAccountingFlagsRuleParams = Omit<
  ChartOfAccountsPredefinedAccountingFlagsWidePropertyRule,
  "type"
>

export function chartOfAccountsPredefinedAccountingFlagsRule<
  const Params extends ChartOfAccountsPredefinedAccountingFlagsRuleParams,
>(
  params: WideExactRuleParams<ChartOfAccountsPredefinedAccountingFlagsRuleParams, Params>
): Readonly<{ type: "ChartOfAccountsPredefinedAccountingFlags" } & Params> {
  return defineWidePropertyRule("ChartOfAccountsPredefinedAccountingFlags", params)
}
export interface ChartOfAccountsPredefinedExtDimensionTypesWidePropertyRule extends WidePropertyRuleBase {
  type: "ChartOfAccountsPredefinedExtDimensionTypes"
}

export type ChartOfAccountsPredefinedExtDimensionTypesRuleParams = Omit<
  ChartOfAccountsPredefinedExtDimensionTypesWidePropertyRule,
  "type"
>

export function chartOfAccountsPredefinedExtDimensionTypesRule<
  const Params extends ChartOfAccountsPredefinedExtDimensionTypesRuleParams,
>(
  params: WideExactRuleParams<ChartOfAccountsPredefinedExtDimensionTypesRuleParams, Params>
): Readonly<{ type: "ChartOfAccountsPredefinedExtDimensionTypes" } & Params> {
  return defineWidePropertyRule("ChartOfAccountsPredefinedExtDimensionTypes", params)
}
export const metadataChartOfAccountsAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataChartOfAccountsAttributes",
  MetadataChartOfAccountsAttributeRules
)
export const metadataChartOfAccountsTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataChartOfAccountsTabularSections",
  MetadataChartOfAccountsTabularSectionRules
)
