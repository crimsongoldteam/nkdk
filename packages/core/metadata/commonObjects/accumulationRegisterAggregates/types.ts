import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { StringboolYAML, StringboolXML } from "~/metadata/commonObjects/boolean/types"
import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { AccumulationRegisterAggregateRules, AccumulationRegisterAggregatesRules } from "./rules"

export type AccumulationRegisterAggregateDimensions = Record<string, boolean>
export type AccumulationRegisterAggregateDimensionsYAML = Record<string, StringboolYAML>

export interface AccumulationRegisterAggregateDimensionXML {
  _ref?: string
  "#text"?: StringboolXML
}

export interface AccumulationRegisterAggregateDimensionsXML {
  Dimension?: AccumulationRegisterAggregateDimensionXML | AccumulationRegisterAggregateDimensionXML[]
}

export type AccumulationRegisterAggregate = MetadataTypeByRule<typeof AccumulationRegisterAggregateRules>
export type AccumulationRegisterAggregateYAML = YAMLTypeByRule<typeof AccumulationRegisterAggregateRules>

export type AccumulationRegisterAggregateCollection = AccumulationRegisterAggregate[]
export type AccumulationRegisterAggregateCollectionYAML = AccumulationRegisterAggregateYAML[]

export type AccumulationRegisterAggregates = MetadataTypeByRule<typeof AccumulationRegisterAggregatesRules>
export type AccumulationRegisterAggregatesYAML = YAMLTypeByRule<typeof AccumulationRegisterAggregatesRules>

registerMetadataItemRule({
  propertyType: "AccumulationRegisterAggregate",
  itemRule: AccumulationRegisterAggregateRules,
})

registerMetadataItemCollectionRule({
  propertyType: "AccumulationRegisterAggregateCollection",
  itemRule: AccumulationRegisterAggregateRules,
  xmlElement: "Aggregate",
  yamlAsArray: true,
})

registerMetadataItemRule({
  propertyType: "AccumulationRegisterAggregates",
  itemRule: AccumulationRegisterAggregatesRules,
})

export interface AccumulationRegisterAggregateCollectionWidePropertyRule extends WidePropertyRuleBase {
  type: "AccumulationRegisterAggregateCollection"
}

export type AccumulationRegisterAggregateCollectionRuleParams = Omit<
  AccumulationRegisterAggregateCollectionWidePropertyRule,
  "type"
>

export function accumulationRegisterAggregateCollectionRule<
  const Params extends AccumulationRegisterAggregateCollectionRuleParams,
>(
  params: WideExactRuleParams<AccumulationRegisterAggregateCollectionRuleParams, Params>
): Readonly<{ type: "AccumulationRegisterAggregateCollection" } & Params> {
  return defineWidePropertyRule("AccumulationRegisterAggregateCollection", params)
}
export interface AccumulationRegisterAggregateDimensionsWidePropertyRule extends WidePropertyRuleBase {
  type: "AccumulationRegisterAggregateDimensions"
}

export type AccumulationRegisterAggregateDimensionsRuleParams = Omit<
  AccumulationRegisterAggregateDimensionsWidePropertyRule,
  "type"
>

export function accumulationRegisterAggregateDimensionsRule<
  const Params extends AccumulationRegisterAggregateDimensionsRuleParams,
>(
  params: WideExactRuleParams<AccumulationRegisterAggregateDimensionsRuleParams, Params>
): Readonly<{ type: "AccumulationRegisterAggregateDimensions" } & Params> {
  return defineWidePropertyRule("AccumulationRegisterAggregateDimensions", params)
}
