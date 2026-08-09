import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataScheduledJobRules } from "./rules"

export type MetadataScheduledJob = MetadataTypeByRule<typeof MetadataScheduledJobRules>
export type MetadataScheduledJobYAML = YAMLTypeByRule<typeof MetadataScheduledJobRules>

registerMetadataItemRule({
  propertyType: "MetadataScheduledJob",
  itemRule: MetadataScheduledJobRules,
})
