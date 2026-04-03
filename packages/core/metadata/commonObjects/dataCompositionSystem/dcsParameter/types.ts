import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { DCSParameterRules } from "./rules"

export type DCSParameter = MetadataTypeByRule<typeof DCSParameterRules>

export type DCSParameterYAML = YAMLTypeByRule<typeof DCSParameterRules>

registerMetadataItemCollectionRule({
  propertyType: "DCSParameter",
  itemRule: DCSParameterRules,
  xmlElement: "Parameter",
  yamlAsArray: true,
})
