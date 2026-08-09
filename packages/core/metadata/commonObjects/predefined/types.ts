import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { PredefinedRules } from "./rules"

export type Predefined = MetadataTypeByRule<typeof PredefinedRules>
export type PredefinedYAML = YAMLTypeByRule<typeof PredefinedRules>

registerMetadataItemRule({
  propertyType: "Predefined",
  itemRule: PredefinedRules,
})
