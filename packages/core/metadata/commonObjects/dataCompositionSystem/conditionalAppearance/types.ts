import { registerMetadataItemRule } from "../../../orchestration"
import { MetadataTypeByRule } from "../../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { ConditionalAppearanceRules } from "./rules"

export type ConditionalAppearance = MetadataTypeByRule<typeof ConditionalAppearanceRules>
export type ConditionalAppearanceYAML = YAMLTypeByRule<typeof ConditionalAppearanceRules>

registerMetadataItemRule({
  propertyType: "ConditionalAppearance",
  itemRule: ConditionalAppearanceRules,
})
