import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCommonFormRules } from "./rules"

export type MetadataCommonForm = MetadataTypeByRule<typeof MetadataCommonFormRules>
export type MetadataCommonFormYAML = YAMLTypeByRule<typeof MetadataCommonFormRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonForm",
  itemRule: MetadataCommonFormRules,
})
