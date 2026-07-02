import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataBusinessProcessRules } from "./rules"

export type MetadataBusinessProcess = MetadataTypeByRule<typeof MetadataBusinessProcessRules>
export type MetadataBusinessProcessYAML = YAMLTypeByRule<typeof MetadataBusinessProcessRules>

registerMetadataItemRule({
  propertyType: "MetadataBusinessProcess",
  itemRule: MetadataBusinessProcessRules,
})
