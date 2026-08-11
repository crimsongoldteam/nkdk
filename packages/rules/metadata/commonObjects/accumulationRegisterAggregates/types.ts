import { StringboolYAML, StringboolXML } from "../boolean/types"
import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
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

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "AccumulationRegisterAggregate",
  itemRule: AccumulationRegisterAggregateRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "AccumulationRegisterAggregateCollection",
  itemRule: AccumulationRegisterAggregateRules,
  xmlElement: "Aggregate",
  yamlAsArray: true,
})

export const metadataRuleLayer002 = defineMetadataItemRule({
  propertyType: "AccumulationRegisterAggregates",
  itemRule: AccumulationRegisterAggregatesRules,
})
