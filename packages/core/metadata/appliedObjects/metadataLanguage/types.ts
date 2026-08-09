import type { MetadataTypeByRule } from "../../ruleRuntime/metadataItem/element"
import type { YAMLTypeByRule } from "../../ruleRuntime/metadataItem/yaml"
import type { MetadataLanguageRules } from "./rules"

export type MetadataLanguage = MetadataTypeByRule<typeof MetadataLanguageRules>
export type MetadataLanguageYAML = YAMLTypeByRule<typeof MetadataLanguageRules>
