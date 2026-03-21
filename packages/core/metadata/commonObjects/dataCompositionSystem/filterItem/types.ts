import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { FilterItemComparisonRules } from "./rules"

export type FilterItemComparison = FormTypeByRule<typeof FilterItemComparisonRules>

export type FilterItemComparisonYAML = YAMLTypeByRule<typeof FilterItemComparisonRules>

