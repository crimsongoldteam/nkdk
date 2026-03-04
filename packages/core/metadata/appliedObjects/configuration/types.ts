import { ElementTypeByRule } from "~/metadata/metadataFactory/types/element"
import { YAMLTypeByRule } from "~/metadata/metadataFactory/types/yaml"
import { ConfigurationRules } from "./rules"

export type Configuration = ElementTypeByRule<typeof ConfigurationRules>

export type ConfigurationYAML = YAMLTypeByRule<typeof ConfigurationRules>
