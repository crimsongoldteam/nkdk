import { registerMetadataItemCollectionRule, registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceFunctionRules } from "./rules"

export type MetadataExternalDataSourceFunction = MetadataTypeByRule<typeof MetadataExternalDataSourceFunctionRules>
export type MetadataExternalDataSourceFunctionYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceFunctionRules>

export type MetadataExternalDataSourceFunctions = MetadataExternalDataSourceFunction[]
export type MetadataExternalDataSourceFunctionsYAML = Record<string, MetadataExternalDataSourceFunctionYAML>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSourceFunction",
  itemRule: MetadataExternalDataSourceFunctionRules,
})

registerMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceFunctions",
  itemRule: MetadataExternalDataSourceFunctionRules,
  xmlElement: "Function",
  keyField: "name",
})
