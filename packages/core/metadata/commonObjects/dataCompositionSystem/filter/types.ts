import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import "../filterItem/types"
import { FilterRules } from "./rules"
import { registerMetadataItemRule } from "~/metadata/orchestration"

export type Filter = MetadataTypeByRule<typeof FilterRules>

export type FilterYAML = YAMLTypeByRule<typeof FilterRules>

registerMetadataItemRule({
  propertyType: "Filter",
  itemRule: FilterRules,
})
