import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FilterRules } from "./rules"

export type Filter = MetadataTypeByRule<typeof FilterRules>

export type FilterYAML = YAMLTypeByRule<typeof FilterRules>
