import { registerMetadataItemCollectionRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { DCSParameterRules } from "./rules"

export type DCSParameter = MetadataTypeByRule<typeof DCSParameterRules>

export type DCSParameterYAML = YAMLTypeByRule<typeof DCSParameterRules>

export type DCSParameters = DCSParameter[]
export type DCSParametersYAML = Record<string, DCSParameterYAML>

registerMetadataItemCollectionRule({
  propertyType: "DCSParameters",
  itemRule: DCSParameterRules,
  xmlElement: "Parameter",
  keyField: "name",
  configurationIndexAddressing: "yamlPath",
})
