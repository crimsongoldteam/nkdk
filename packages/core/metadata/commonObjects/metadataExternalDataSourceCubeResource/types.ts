import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceCubeResourceRules } from "./rules"

export type MetadataExternalDataSourceCubeResource = MetadataTypeByRule<
  typeof MetadataExternalDataSourceCubeResourceRules
>
export type MetadataExternalDataSourceCubeResourceYAML = YAMLTypeByRule<
  typeof MetadataExternalDataSourceCubeResourceRules
>

export type MetadataExternalDataSourceCubeResources = MetadataExternalDataSourceCubeResource[]
export type MetadataExternalDataSourceCubeResourcesYAML = Record<string, MetadataExternalDataSourceCubeResourceYAML>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceCubeResource",
  itemRule: MetadataExternalDataSourceCubeResourceRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceCubeResources",
  itemRule: MetadataExternalDataSourceCubeResourceRules,
  xmlElement: "Resource",
  keyField: "name",
})
