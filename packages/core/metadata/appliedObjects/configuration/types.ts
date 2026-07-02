import { MetadataTypeByRule } from "../../orchestration/metadataItem/element"
import { YAMLTypeByRule } from "../../orchestration/metadataItem/yaml"
import { MetadataConfigurationRules } from "./rules"

export type MetadataConfiguration = MetadataTypeByRule<typeof MetadataConfigurationRules>
export type MetadataConfigurationYAML = YAMLTypeByRule<typeof MetadataConfigurationRules>
