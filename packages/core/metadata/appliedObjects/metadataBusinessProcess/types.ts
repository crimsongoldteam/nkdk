import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataBusinessProcessRules } from "./rules"

export type MetadataBusinessProcess = MetadataTypeByRule<typeof MetadataBusinessProcessRules>
export type MetadataBusinessProcessYAML = YAMLTypeByRule<typeof MetadataBusinessProcessRules>

registerMetadataItemRule({
  propertyType: "MetadataBusinessProcess",
  itemRule: MetadataBusinessProcessRules,
})
