import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataExternalDataSourceRules } from "./rules"

export type MetadataExternalDataSource = MetadataTypeByRule<typeof MetadataExternalDataSourceRules>
export type MetadataExternalDataSourceYAML = YAMLTypeByRule<typeof MetadataExternalDataSourceRules>

registerMetadataItemRule({
  propertyType: "MetadataExternalDataSource",
  itemRule: MetadataExternalDataSourceRules,
})
