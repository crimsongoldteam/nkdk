import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FilterItemGroupRules } from "./rules"

export type FilterItemGroup = FormTypeByRule<typeof FilterItemGroupRules>

export type FilterItemGroupYAML = YAMLTypeByRule<typeof FilterItemGroupRules>
