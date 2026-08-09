import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
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
  collectionItemRule: true,
})
