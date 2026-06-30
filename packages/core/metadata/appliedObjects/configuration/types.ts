import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataConfigurationRules } from "./rules"

export type MetadataConfiguration = MetadataTypeByRule<typeof MetadataConfigurationRules>
export type MetadataConfigurationYAML = YAMLTypeByRule<typeof MetadataConfigurationRules>
