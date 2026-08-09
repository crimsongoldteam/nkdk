import { registerMetadataItemRule } from "../../ruleRuntime"
import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataCommonModuleRules } from "./rules"

export type MetadataCommonModule = MetadataTypeByRule<typeof MetadataCommonModuleRules>
export type MetadataCommonModuleYAML = YAMLTypeByRule<typeof MetadataCommonModuleRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonModule",
  itemRule: MetadataCommonModuleRules,
})
