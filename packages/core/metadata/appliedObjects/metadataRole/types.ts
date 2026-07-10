import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataRoleRules } from "./rules"

export type MetadataRole = MetadataTypeByRule<typeof MetadataRoleRules>
export type MetadataRoleYAML = YAMLTypeByRule<typeof MetadataRoleRules>

registerMetadataItemRule({
  propertyType: "MetadataRole",
  itemRule: MetadataRoleRules,
})
