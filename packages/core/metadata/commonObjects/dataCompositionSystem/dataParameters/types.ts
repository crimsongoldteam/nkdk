import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { DataParametersRules } from "./rules"

export type DataParameters = MetadataTypeByRule<typeof DataParametersRules>
export type DataParametersYAML = YAMLTypeByRule<typeof DataParametersRules>

registerMetadataItemRule({
  propertyType: "DataParameters",
  itemRule: DataParametersRules,
})
