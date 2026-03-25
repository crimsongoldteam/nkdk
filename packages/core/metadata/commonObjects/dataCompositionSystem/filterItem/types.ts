import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

export type FilterItemComparison = FormTypeByRule<typeof FilterItemComparisonRules>
export type FilterItemComparisonYAML = YAMLTypeByRule<typeof FilterItemComparisonRules>

export type FilterItemGroup = FormTypeByRule<typeof FilterItemGroupRules>
export type FilterItemGroupYAML = YAMLTypeByRule<typeof FilterItemGroupRules>

export type FilterItem = FilterItemComparison | FilterItemGroup
export type FilterItemYAML = FilterItemComparisonYAML | FilterItemGroupYAML
