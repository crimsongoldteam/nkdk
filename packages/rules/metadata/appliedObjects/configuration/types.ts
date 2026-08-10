import { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import { MetadataConfigurationRules } from "./rules"

export type MetadataConfiguration = MetadataTypeByRule<typeof MetadataConfigurationRules>
export type MetadataConfigurationYAML = YAMLTypeByRule<typeof MetadataConfigurationRules>
