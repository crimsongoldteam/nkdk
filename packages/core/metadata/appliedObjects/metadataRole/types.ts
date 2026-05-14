import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataRoleRules } from "./rules"

export type MetadataRole = MetadataTypeByRule<typeof MetadataRoleRules>
export type MetadataRoleYAML = YAMLTypeByRule<typeof MetadataRoleRules>

registerMetadataItemRule({
  propertyType: "MetadataRole",
  itemRule: MetadataRoleRules,
})
