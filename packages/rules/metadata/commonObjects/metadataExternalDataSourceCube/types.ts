import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceCubeCollectionRules, MetadataExternalDataSourceCubeRules } from "./rules"

export type MetadataExternalDataSourceCube = MetadataTypeByRule<typeof MetadataExternalDataSourceCubeRules>
export type MetadataExternalDataSourceCubeYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceCubeRules>

export type MetadataExternalDataSourceCubes = MetadataExternalDataSourceCube[]
export type MetadataExternalDataSourceCubesYAML = Record<string, MetadataExternalDataSourceCubeYAML>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataExternalDataSourceCube",
  itemRule: MetadataExternalDataSourceCubeRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceCubes",
  itemRule: MetadataExternalDataSourceCubeCollectionRules,
  xmlElement: "Cube",
  keyField: "name",
  collectionItemRule: true,
})
