import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { ParameterValueDcsValueFragment, ParameterValueXML } from "../parameterValue/types"
import { AppearanceFieldsRules, type DirectAppearanceXMLTag } from "./rules"

export type AppearanceFields = FormTypeByRule<typeof AppearanceFieldsRules>

export type AppearanceFieldsYAML = YAMLTypeByRule<typeof AppearanceFieldsRules>

export type DirectAppearanceFieldXML = {
  "dcsset:value"?: ParameterValueDcsValueFragment | ParameterValueDcsValueFragment[]
}

export type AppearanceFieldsXML = Partial<Record<DirectAppearanceXMLTag, DirectAppearanceFieldXML>> & {
  "dcscor:item"?: ParameterValueXML | ParameterValueXML[]
}

export interface AppearanceFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "AppearanceFields"
}

export type AppearanceFieldsRuleParams = Omit<AppearanceFieldsWidePropertyRule, "type">

export function appearanceFieldsRule<const Params extends AppearanceFieldsRuleParams>(
  params: WideExactRuleParams<AppearanceFieldsRuleParams, Params>
): Readonly<{ type: "AppearanceFields" } & Params> {
  return defineWidePropertyRule("AppearanceFields", params)
}
