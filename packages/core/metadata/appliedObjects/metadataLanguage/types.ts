import type { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import type { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { MetadataLanguageRules } from "./rules"

export type MetadataLanguage = MetadataTypeByRule<typeof MetadataLanguageRules>
export type MetadataLanguageYAML = YAMLTypeByRule<typeof MetadataLanguageRules>
