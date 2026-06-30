import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PredefinedRules } from "./rules"

export type Predefined = MetadataTypeByRule<typeof PredefinedRules>
export type PredefinedYAML = YAMLTypeByRule<typeof PredefinedRules>

registerMetadataItemRule({
  propertyType: "Predefined",
  itemRule: PredefinedRules,
})

export interface PredefinedWidePropertyRule extends WidePropertyRuleBase {
  type: "Predefined"
}

export type PredefinedRuleParams = Omit<PredefinedWidePropertyRule, "type">

export function predefinedRule<const Params extends PredefinedRuleParams>(
  params: WideExactRuleParams<PredefinedRuleParams, Params>
): Readonly<{ type: "Predefined" } & Params> {
  return defineWidePropertyRule("Predefined", params)
}
