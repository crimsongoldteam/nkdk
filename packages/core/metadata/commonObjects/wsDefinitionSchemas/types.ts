import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../orchestration/property/types"
import type { BasePropertyRule } from "../../orchestration"

export interface WSDefinitionSchemasPropertyRule extends BasePropertyRule {
  type: "WSDefinitionSchemas"
  syncExternalOnly: true
}

export interface WSDefinitionSchemasWidePropertyRule extends WidePropertyRuleBase {
  type: "WSDefinitionSchemas"
}

export type WSDefinitionSchemasRuleParams = Omit<WSDefinitionSchemasWidePropertyRule, "type">

export function wSDefinitionSchemasRule<const Params extends WSDefinitionSchemasRuleParams>(
  params: WideExactRuleParams<WSDefinitionSchemasRuleParams, Params>
): Readonly<{ type: "WSDefinitionSchemas" } & Params> {
  return defineWidePropertyRule("WSDefinitionSchemas", params)
}
