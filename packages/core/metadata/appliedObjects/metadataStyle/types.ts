import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataStyleRules } from "./rules"

export type MetadataStyle = MetadataTypeByRule<typeof MetadataStyleRules>
export type MetadataStyleYAML = YAMLTypeByRule<typeof MetadataStyleRules>

registerMetadataItemRule({
  propertyType: "MetadataStyle",
  itemRule: MetadataStyleRules,
})
