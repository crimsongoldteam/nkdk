import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import { FilterItem } from "./types"
import "./inlineTypes"
import "./typedValues"

const exportFilterItemElementToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: FilterItem[number] | undefined
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

export const exportFilterItemToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: FilterItem | undefined
) => {
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const xml = exportFilterItemElementToXML(context, rule, item)
    return xml ? [xml] : []
  })
  return exported.length > 0 ? exported : undefined
}
