import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import "./inlineTypes"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import "./typedValues"
import { FilterItem } from "./types"

const exportFilterItemElementToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: FilterItem[number] | undefined
}) => {
  const { context, value } = params
  if (!value) return undefined

  if (value.itemType === "FilterItemComparison") {
    return {
      "_xsi:type": "dcsset:FilterItemComparison",
      ...exportMetadataItemToXML({
        context,
        data: value,
        rule: FilterItemComparisonRules,
      }),
    }
  }

  if (value.itemType === "FilterItemGroup") {
    return {
      "_xsi:type": "dcsset:FilterItemGroup",
      ...exportMetadataItemToXML({
        context,
        data: value,
        rule: FilterItemGroupRules,
      }),
    }
  }

  return undefined
}

export const exportFilterItemToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: FilterItem | undefined
  // referenceMetadata?: FilterItem | undefined
}) => {
  const { context, rule, value } = params
  if (!value || value.length === 0) return undefined
  const exported = value.flatMap((item) => {
    const xml = exportFilterItemElementToXML({
      context,
      rule,
      value: item,
    })
    return xml ? [xml] : []
  })
  return exported.length > 0 ? exported : undefined
}
