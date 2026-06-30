import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataChartOfAccountsRules } from "./rules"

export type MetadataChartOfAccounts = MetadataTypeByRule<typeof MetadataChartOfAccountsRules>
export type MetadataChartOfAccountsYAML = YAMLTypeByRule<typeof MetadataChartOfAccountsRules>

registerMetadataItemRule({
  propertyType: "MetadataChartOfAccounts",
  itemRule: MetadataChartOfAccountsRules,
})

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
export interface MetadataChartOfAccountsTabularSectionsWidePropertyRule extends WidePropertyRuleBase {
  type: "MetadataChartOfAccountsTabularSections"
}

export type MetadataChartOfAccountsTabularSectionsRuleParams = Omit<
  MetadataChartOfAccountsTabularSectionsWidePropertyRule,
  "type"
>

export function metadataChartOfAccountsTabularSectionsRule<
  const Params extends MetadataChartOfAccountsTabularSectionsRuleParams,
>(
  params: WideExactRuleParams<MetadataChartOfAccountsTabularSectionsRuleParams, Params>
): Readonly<{ type: "MetadataChartOfAccountsTabularSections" } & Params> {
  return defineWidePropertyRule("MetadataChartOfAccountsTabularSections", params)
}
