import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceCubeCollectionRules, MetadataExternalDataSourceCubeRules } from "./rules"

export type MetadataExternalDataSourceCube = MetadataTypeByRule<typeof MetadataExternalDataSourceCubeRules>
export type MetadataExternalDataSourceCubeYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceCubeRules>

export type MetadataExternalDataSourceCubes = MetadataExternalDataSourceCube[]
export type MetadataExternalDataSourceCubesYAML = Record<string, MetadataExternalDataSourceCubeYAML>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceCube",
  itemRule: MetadataExternalDataSourceCubeRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceCubes",
  itemRule: MetadataExternalDataSourceCubeCollectionRules,
  xmlElement: "Cube",
  keyField: "name",
})
