import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataStyleRules } from "./rules"

export type MetadataStyle = MetadataTypeByRule<typeof MetadataStyleRules>
export type MetadataStyleYAML = YAMLTypeByRule<typeof MetadataStyleRules>

registerMetadataItemRule({
  propertyType: "MetadataStyle",
  itemRule: MetadataStyleRules,
})
