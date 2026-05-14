import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataTaskRules } from "./rules"

export type MetadataTask = MetadataTypeByRule<typeof MetadataTaskRules>
export type MetadataTaskYAML = YAMLTypeByRule<typeof MetadataTaskRules>

registerMetadataItemRule({
  propertyType: "MetadataTask",
  itemRule: MetadataTaskRules,
})
