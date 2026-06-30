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
