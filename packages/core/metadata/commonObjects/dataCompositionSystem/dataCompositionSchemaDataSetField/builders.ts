import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

export interface DataCompositionSchemaDataSetFieldKindWidePropertyRule extends WidePropertyRuleBase {
  type: "DataCompositionSchemaDataSetFieldKind"
}

export type DataCompositionSchemaDataSetFieldKindRuleParams = Omit<
  DataCompositionSchemaDataSetFieldKindWidePropertyRule,
  "type"
>

export function dataCompositionSchemaDataSetFieldKindRule<
  const Params extends DataCompositionSchemaDataSetFieldKindRuleParams,
>(
  params: WideExactRuleParams<DataCompositionSchemaDataSetFieldKindRuleParams, Params>
): Readonly<{ type: "DataCompositionSchemaDataSetFieldKind" } & Params> {
  return defineWidePropertyRule("DataCompositionSchemaDataSetFieldKind", params)
}
