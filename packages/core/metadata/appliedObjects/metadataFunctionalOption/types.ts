import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataFunctionalOptionRules } from "./rules"

export type MetadataFunctionalOption = MetadataTypeByRule<typeof MetadataFunctionalOptionRules>
export type MetadataFunctionalOptionYAML = YAMLTypeByRule<typeof MetadataFunctionalOptionRules>

registerMetadataItemRule({
  propertyType: "MetadataFunctionalOption",
  itemRule: MetadataFunctionalOptionRules,
})
