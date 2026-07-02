import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataDataProcessorRules } from "./rules"

export type MetadataDataProcessor = MetadataTypeByRule<typeof MetadataDataProcessorRules>
export type MetadataDataProcessorYAML = YAMLTypeByRule<typeof MetadataDataProcessorRules>

registerMetadataItemRule({
  propertyType: "MetadataDataProcessor",
  itemRule: MetadataDataProcessorRules,
})
