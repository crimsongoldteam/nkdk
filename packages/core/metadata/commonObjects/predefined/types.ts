import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { PredefinedRules } from "./rules"

export type Predefined = MetadataTypeByRule<typeof PredefinedRules>
export type PredefinedYAML = YAMLTypeByRule<typeof PredefinedRules>

registerMetadataItemRule({
  propertyType: "Predefined",
  itemRule: PredefinedRules,
})
