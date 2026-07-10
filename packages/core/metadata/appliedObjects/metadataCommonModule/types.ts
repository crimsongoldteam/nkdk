import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCommonModuleRules } from "./rules"

export type MetadataCommonModule = MetadataTypeByRule<typeof MetadataCommonModuleRules>
export type MetadataCommonModuleYAML = YAMLTypeByRule<typeof MetadataCommonModuleRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonModule",
  itemRule: MetadataCommonModuleRules,
})
