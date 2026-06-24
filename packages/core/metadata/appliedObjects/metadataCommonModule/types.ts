import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCommonModuleRules } from "./rules"

export type MetadataCommonModule = MetadataTypeByRule<typeof MetadataCommonModuleRules>
export type MetadataCommonModuleYAML = YAMLTypeByRule<typeof MetadataCommonModuleRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonModule",
  itemRule: MetadataCommonModuleRules,
})
