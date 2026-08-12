import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { I8nTextYAML } from "../../i8nText/types"
import type { MetadataDcsMetadataValue, MetadataDcsMetadataValueYAML } from "../dcsMetadataValue/types"
import type { DcsLocalStringValue } from "../dcsLocalStringType/types"

export interface DcsAvailableValue {
  itemType: "DcsAvailableValue"
  value?: MetadataDcsMetadataValue
  presentation?: DcsLocalStringValue
}

export interface DcsAvailableValueYAML {
  Значение?: MetadataDcsMetadataValueYAML
  Представление?: I8nTextYAML | string
}

export type DcsAvailableValues = DcsAvailableValue[]

export type DcsAvailableValuesYAML = DcsAvailableValueYAML[]

export interface DcsAvailableValuesWidePropertyRule extends WidePropertyRuleBase {
  type: "DcsAvailableValues"
}

export type DcsAvailableValuesRuleParams = Omit<DcsAvailableValuesWidePropertyRule, "type">

export function dcsAvailableValuesRule<const Params extends DcsAvailableValuesRuleParams>(
  params: WideExactRuleParams<DcsAvailableValuesRuleParams, Params>
): Readonly<{ type: "DcsAvailableValues" } & Params> {
  return defineWidePropertyRule("DcsAvailableValues", { configurationIndexAddressing: "yamlPath" as const, ...params })
}
