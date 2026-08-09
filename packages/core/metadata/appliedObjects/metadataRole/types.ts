import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataRoleRules } from "./rules"

export type MetadataRole = MetadataTypeByRule<typeof MetadataRoleRules>
export type MetadataRoleYAML = YAMLTypeByRule<typeof MetadataRoleRules>

registerMetadataItemRule({
  propertyType: "MetadataRole",
  itemRule: MetadataRoleRules,
})
