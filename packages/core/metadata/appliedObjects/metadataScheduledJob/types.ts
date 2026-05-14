import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataScheduledJobRules } from "./rules"

export type MetadataScheduledJob = MetadataTypeByRule<typeof MetadataScheduledJobRules>
export type MetadataScheduledJobYAML = YAMLTypeByRule<typeof MetadataScheduledJobRules>

registerMetadataItemRule({
  propertyType: "MetadataScheduledJob",
  itemRule: MetadataScheduledJobRules,
})
