import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew } from "~/metadata/orchestration"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import "./inlineTypes"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import "./typedValues"
import { FilterItem, FilterItemComparison, FilterItemGroup } from "./types"

const filterItemComparisonMatchKey = (item: FilterItemComparison): string =>
  JSON.stringify({ leftValue: item.leftValue, comparisonType: item.comparisonType })

const filterItemGroupMatchKey = (item: FilterItemGroup): string => String(item.groupType ?? "")

const findReferenceFilterItem = (
  item: FilterItem[number],
  referenceItems: FilterItem,
  usedIndices: Set<number>
): FilterItem[number] | undefined => {
  for (let i = 0; i < referenceItems.length; i++) {
    if (usedIndices.has(i)) continue
    const refItem = referenceItems[i]
    if (item.itemType !== refItem.itemType) continue
    if (
      item.itemType === "FilterItemComparison" &&
      refItem.itemType === "FilterItemComparison" &&
      filterItemComparisonMatchKey(item) === filterItemComparisonMatchKey(refItem)
    ) {
      usedIndices.add(i)
      return refItem
    }
    if (
      item.itemType === "FilterItemGroup" &&
      refItem.itemType === "FilterItemGroup" &&
      filterItemGroupMatchKey(item) === filterItemGroupMatchKey(refItem)
    ) {
      usedIndices.add(i)
      return refItem
    }
  }
  return undefined
}

const exportFilterItemElementToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: FilterItem[number] | undefined
  referenceData?: FilterItem[number]
}) => {
  const { context, value, referenceData } = params
  if (!value) return undefined

  if (value.itemType === "FilterItemComparison") {
    return {
      "_xsi:type": "dcsset:FilterItemComparison",
      ...exportMetadataItemToXML({
        context,
        data: value,
        rule: FilterItemComparisonRules,
        referenceData: referenceData?.itemType === "FilterItemComparison" ? referenceData : undefined,
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
        referenceData: referenceData?.itemType === "FilterItemGroup" ? referenceData : undefined,
      }),
    }
  }

  return undefined
}

export const exportFilterItemToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: FilterItem | undefined
  referenceMetadata?: FilterItem
}) => {
  const { context, rule, value, referenceMetadata } = params
  if (!value || value.length === 0) return undefined
  const usedIndices = new Set<number>()
  const exported = value.flatMap((item) => {
    const refItem = Array.isArray(referenceMetadata)
      ? findReferenceFilterItem(item, referenceMetadata, usedIndices)
      : undefined
    const xml = exportFilterItemElementToXML({
      context,
      rule,
      value: item,
      referenceData: refItem,
    })
    return xml ? [xml] : []
  })
  return exported.length > 0 ? exported : undefined
}
