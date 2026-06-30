import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import type { BasePropertyRule } from "~/metadata/orchestration"

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
