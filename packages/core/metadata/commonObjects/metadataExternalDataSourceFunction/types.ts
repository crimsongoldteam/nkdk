import { defineMetadataItemCollectionRule, defineMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataExternalDataSourceFunctionRules } from "./rules"

export type MetadataExternalDataSourceFunction = MetadataTypeByRule<typeof MetadataExternalDataSourceFunctionRules>
export type MetadataExternalDataSourceFunctionYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceFunctionRules>

export type MetadataExternalDataSourceFunctions = MetadataExternalDataSourceFunction[]
export type MetadataExternalDataSourceFunctionsYAML = Record<string, MetadataExternalDataSourceFunctionYAML>

export const metadataRuleLayer000 = defineMetadataItemRule({
  propertyType: "MetadataExternalDataSourceFunction",
  itemRule: MetadataExternalDataSourceFunctionRules,
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "MetadataExternalDataSourceFunctions",
  itemRule: MetadataExternalDataSourceFunctionRules,
  xmlElement: "Function",
  keyField: "name",
})
