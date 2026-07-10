import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataScheduledJobRules } from "./rules"

export type MetadataScheduledJob = MetadataTypeByRule<typeof MetadataScheduledJobRules>
export type MetadataScheduledJobYAML = YAMLTypeByRule<typeof MetadataScheduledJobRules>

registerMetadataItemRule({
  propertyType: "MetadataScheduledJob",
  itemRule: MetadataScheduledJobRules,
})
