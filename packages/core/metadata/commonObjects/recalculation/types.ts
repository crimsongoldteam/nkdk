import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { Type } from "@sinclair/typebox"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { RecalculationRules } from "./rules"

export type Recalculation = MetadataTypeByRule<typeof RecalculationRules>
export type RecalculationYAML = YAMLTypeByRule<typeof RecalculationRules>

export type Recalculations = Recalculation[]
export type RecalculationsXML = string | string[]

export const RecalculationsJSONSchema = Type.Record(Type.String(), Type.Any())
export type RecalculationsYAML = Record<MetadataNameYAML, RecalculationYAML>

export interface RecalculationsWidePropertyRule extends WidePropertyRuleBase {
  type: "Recalculations"
}

export type RecalculationsRuleParams = Omit<RecalculationsWidePropertyRule, "type">

export function recalculationsRule<const Params extends RecalculationsRuleParams>(
  params: WideExactRuleParams<RecalculationsRuleParams, Params>
): Readonly<{ type: "Recalculations" } & Params> {
  return defineWidePropertyRule("Recalculations", params)
}
