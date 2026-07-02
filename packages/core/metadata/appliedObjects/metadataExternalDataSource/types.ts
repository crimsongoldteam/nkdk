import { registerMetadataItemRule } from "../../orchestration"
import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceRules } from "./rules"

export type MetadataExternalDataSource = MetadataTypeByRule<typeof MetadataExternalDataSourceRules>
export type MetadataExternalDataSourceYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceRules>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSource",
  itemRule: MetadataExternalDataSourceRules,
})
