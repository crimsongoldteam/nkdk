import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataCommonFormRules } from "./rules"

export type MetadataCommonForm = MetadataTypeByRule<typeof MetadataCommonFormRules>
export type MetadataCommonFormYAML = YAMLTypeByRule<typeof MetadataCommonFormRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonForm",
  itemRule: MetadataCommonFormRules,
})
