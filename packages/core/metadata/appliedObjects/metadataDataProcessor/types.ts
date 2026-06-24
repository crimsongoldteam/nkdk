import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataDataProcessorRules } from "./rules"

export type MetadataDataProcessor = MetadataTypeByRule<typeof MetadataDataProcessorRules>
export type MetadataDataProcessorYAML = YAMLTypeByRule<typeof MetadataDataProcessorRules>

registerMetadataItemRule({
  propertyType: "MetadataDataProcessor",
  itemRule: MetadataDataProcessorRules,
})
