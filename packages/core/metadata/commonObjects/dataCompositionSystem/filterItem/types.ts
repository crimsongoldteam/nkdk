import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import type { FilterItemGroup, FilterItemGroupYAML } from "../filterItemGroup/types"
import { FilterItemComparisonRules } from "./rules"

export type FilterItemComparison = FormTypeByRule<typeof FilterItemComparisonRules>

export type FilterItemComparisonYAML = YAMLTypeByRule<typeof FilterItemComparisonRules>

export type FilterItem = FilterItemComparison | FilterItemGroup

export type FilterItemYAML = FilterItemComparisonYAML | FilterItemGroupYAML
