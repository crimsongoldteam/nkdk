import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataStyleRules } from "./rules"

export type MetadataStyle = MetadataTypeByRule<typeof MetadataStyleRules>
export type MetadataStyleYAML = YAMLTypeByRule<typeof MetadataStyleRules>

registerMetadataItemRule({
  propertyType: "MetadataStyle",
  itemRule: MetadataStyleRules,
})
