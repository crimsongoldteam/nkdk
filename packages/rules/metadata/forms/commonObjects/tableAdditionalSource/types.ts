import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { TableAdditionalSourceType } from "@nkdk/runtime/rule-kit"

export type TableAdditionalSourceTypes = TableAdditionalSourceType

export interface TableAdditionalSourceXML {
  Item: string
  Type: TableAdditionalSourceTypes
}

export interface TableAdditionalSourceWidePropertyRule extends WidePropertyRuleBase {
  type: "TableAdditionalSource"
}

export type TableAdditionalSourceRuleParams = Omit<TableAdditionalSourceWidePropertyRule, "type">

export function tableAdditionalSourceRule<const Params extends TableAdditionalSourceRuleParams>(
  params: WideExactRuleParams<TableAdditionalSourceRuleParams, Params>
): Readonly<{ type: "TableAdditionalSource" } & Params> {
  return defineWidePropertyRule("TableAdditionalSource", params)
}
