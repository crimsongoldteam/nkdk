import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceCubeDimensionRules } from "./rules"

export type MetadataExternalDataSourceCubeDimension = MetadataTypeByRule<
  typeof MetadataExternalDataSourceCubeDimensionRules
>
export type MetadataExternalDataSourceCubeDimensionYAML = YAMLTypeByRule<
  typeof MetadataExternalDataSourceCubeDimensionRules
>

export type MetadataExternalDataSourceCubeDimensions = MetadataExternalDataSourceCubeDimension[]
export type MetadataExternalDataSourceCubeDimensionsYAML = Record<
  string,
  MetadataExternalDataSourceCubeDimensionYAML
>

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
