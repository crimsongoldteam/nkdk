import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataFunctionalOptionRules } from "./rules"

export type MetadataFunctionalOption = MetadataTypeByRule<typeof MetadataFunctionalOptionRules>
export type MetadataFunctionalOptionYAML = YAMLTypeByRule<typeof MetadataFunctionalOptionRules>

registerMetadataItemRule({
  propertyType: "MetadataFunctionalOption",
  itemRule: MetadataFunctionalOptionRules,
})
