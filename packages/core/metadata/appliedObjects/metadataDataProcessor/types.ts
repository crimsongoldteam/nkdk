import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataDataProcessorRules } from "./rules"

export type MetadataDataProcessor = MetadataTypeByRule<typeof MetadataDataProcessorRules>
export type MetadataDataProcessorYAML = YAMLTypeByRule<typeof MetadataDataProcessorRules>

registerMetadataItemRule({
  propertyType: "MetadataDataProcessor",
  itemRule: MetadataDataProcessorRules,
})
