import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataBusinessProcessRules } from "./rules"

export type MetadataBusinessProcess = MetadataTypeByRule<typeof MetadataBusinessProcessRules>
export type MetadataBusinessProcessYAML = YAMLTypeByRule<typeof MetadataBusinessProcessRules>

registerMetadataItemRule({
  propertyType: "MetadataBusinessProcess",
  itemRule: MetadataBusinessProcessRules,
})
