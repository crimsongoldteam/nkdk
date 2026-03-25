import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportMetadataItemToYAML } from "~/metadata/orchestration/metadataItem/toYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { FilterItem } from "./types"

const exportFilterItemToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: FilterItem | undefined
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

registerTypeRule("FilterItem", "exportToYAML", exportFilterItemToYAML)
