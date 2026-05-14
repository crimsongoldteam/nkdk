import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataFunctionalOptionRules } from "./rules"

export type MetadataFunctionalOption = MetadataTypeByRule<typeof MetadataFunctionalOptionRules>
export type MetadataFunctionalOptionYAML = YAMLTypeByRule<typeof MetadataFunctionalOptionRules>

registerMetadataItemRule({
  propertyType: "MetadataFunctionalOption",
  itemRule: MetadataFunctionalOptionRules,
})
