import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataTaskRules } from "./rules"

export type MetadataTask = MetadataTypeByRule<typeof MetadataTaskRules>
export type MetadataTaskYAML = YAMLTypeByRule<typeof MetadataTaskRules>

registerMetadataItemRule({
  propertyType: "MetadataTask",
  itemRule: MetadataTaskRules,
})
