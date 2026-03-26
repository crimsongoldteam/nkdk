import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToYAML } from "~/metadata/orchestration/metadataItem/toYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { FilterItem } from "./types"
import "./inlineTypes"
import "./typedValues"

const exportFilterItemElementToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: FilterItem[number] | undefined
) => {
  if (!value) return undefined

  if (value.itemType === "FilterItemComparison") {
    return exportMetadataItemToYAML({ context, data: value, rule: FilterItemComparisonRules })
  }

  if (value.itemType === "FilterItemGroup") {
    return exportMetadataItemToYAML({ context, data: value, rule: FilterItemGroupRules })
  }

  return undefined
}

export const exportFilterItemToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: FilterItem | undefined
) => {
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const exportedItem = exportFilterItemElementToYAML(context, rule, item)
    return exportedItem ? [exportedItem] : []
  })
  return exported.length > 0 ? exported : undefined
}
