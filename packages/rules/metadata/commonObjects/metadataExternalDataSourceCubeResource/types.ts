import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceCubeResourceRules } from "./rules"

export type MetadataExternalDataSourceCubeResource = MetadataTypeByRule<
  typeof MetadataExternalDataSourceCubeResourceRules
>
export type MetadataExternalDataSourceCubeResourceYAML = YAMLTypeByRule<
  typeof MetadataExternalDataSourceCubeResourceRules
>

export type MetadataExternalDataSourceCubeResources = MetadataExternalDataSourceCubeResource[]
export type MetadataExternalDataSourceCubeResourcesYAML = Record<string, MetadataExternalDataSourceCubeResourceYAML>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataExternalDataSourceCubeResource",
  itemRule: MetadataExternalDataSourceCubeResourceRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceCubeResources",
  itemRule: MetadataExternalDataSourceCubeResourceRules,
  xmlElement: "Resource",
  keyField: "name",
})
