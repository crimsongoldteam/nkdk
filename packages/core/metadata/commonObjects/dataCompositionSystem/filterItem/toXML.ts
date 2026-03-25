import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { FilterItem } from "./types"

const exportFilterItemToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: FilterItem | undefined
) => {
  if (!value) return undefined

  if (value.itemType === "FilterItemComparison") {
    return {
      "_xsi:type": "dcsset:FilterItemComparison",
      ...exportMetadataItemToXML({ context, data: value, rule: FilterItemComparisonRules }),
    }
  }

  if (value.itemType === "FilterItemGroup") {
    return {
      "_xsi:type": "dcsset:FilterItemGroup",
      ...exportMetadataItemToXML({ context, data: value, rule: FilterItemGroupRules }),
    }
  }

  return undefined
}

registerTypeRule("FilterItem", "exportToXML", exportFilterItemToXML)
