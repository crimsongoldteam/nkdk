import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceCubeDimensionRules } from "./rules"

export type MetadataExternalDataSourceCubeDimension = MetadataTypeByRule<
  typeof MetadataExternalDataSourceCubeDimensionRules
>
export type MetadataExternalDataSourceCubeDimensionYAML = YAMLTypeByRule<
  typeof MetadataExternalDataSourceCubeDimensionRules
>

export type MetadataExternalDataSourceCubeDimensions = MetadataExternalDataSourceCubeDimension[]
export type MetadataExternalDataSourceCubeDimensionsYAML = Record<string, MetadataExternalDataSourceCubeDimensionYAML>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceCubeDimension",
  itemRule: MetadataExternalDataSourceCubeDimensionRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceCubeDimensions",
  itemRule: MetadataExternalDataSourceCubeDimensionRules,
  xmlElement: "Dimension",
  keyField: "name",
})
