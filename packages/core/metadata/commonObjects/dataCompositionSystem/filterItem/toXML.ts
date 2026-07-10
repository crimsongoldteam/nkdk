import { ConfigurationContextWithExportToXML } from "../../../context/types"
import { ExportToXMLFunctionNew } from "../../../orchestration"
import { exportMetadataItemToXML } from "../../../orchestration/metadataItem/toXML"
import type { PropertyRule } from "../../../orchestration/property/types"
import "./inlineTypes"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"
import "./typedValues"
import type { FilterItem, FilterItemComparison, FilterItemGroup } from "./types"

const normalizeFilterItemMatchValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeFilterItemMatchValue)
  if (value === null || typeof value !== "object") return value

  const record = value as Record<string, unknown>
  if (record.type === "Field" && typeof record.value === "string") {
    return { ...record, value: record.value.startsWith(".") ? record.value.slice(1) : record.value }
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, itemValue]) => [key, normalizeFilterItemMatchValue(itemValue)])
  )
}

const filterItemComparisonBaseMatchKey = (item: FilterItemComparison): string =>
  JSON.stringify({
    leftValue: normalizeFilterItemMatchValue(item.leftValue),
    comparisonType: item.comparisonType ?? "Equal",
  })

const filterItemComparisonStrictMatchKey = (item: FilterItemComparison): string =>
  JSON.stringify({
    leftValue: normalizeFilterItemMatchValue(item.leftValue),
    comparisonType: item.comparisonType ?? "Equal",
    rightValue: normalizeFilterItemMatchValue(item.rightValue),
  })

const filterItemGroupMatchKey = (item: FilterItemGroup): string => String(item.groupType ?? "")

const findOnlyIndex = (indices: number[]): number | undefined => (indices.length === 1 ? indices[0] : undefined)

const findReferenceFilterItem = (
  item: FilterItem[number],
  referenceItems: FilterItem,
  usedIndices: Set<number>
): FilterItem[number] | undefined => {
  const candidateIndices: number[] = []

  for (let i = 0; i < referenceItems.length; i++) {
    if (usedIndices.has(i)) continue
    const refItem = referenceItems[i]
    if (item.itemType !== refItem.itemType) continue

    if (
      item.itemType === "FilterItemComparison" &&
      refItem.itemType === "FilterItemComparison" &&
      filterItemComparisonBaseMatchKey(item) === filterItemComparisonBaseMatchKey(refItem)
    ) {
      candidateIndices.push(i)
      continue
    }

    if (
      item.itemType === "FilterItemGroup" &&
      refItem.itemType === "FilterItemGroup" &&
      filterItemGroupMatchKey(item) === filterItemGroupMatchKey(refItem)
    ) {
      candidateIndices.push(i)
    }
  }

  const onlyCandidateIndex = findOnlyIndex(candidateIndices)
  if (onlyCandidateIndex !== undefined) {
    usedIndices.add(onlyCandidateIndex)
    return referenceItems[onlyCandidateIndex]
  }

  if (item.itemType !== "FilterItemComparison") return undefined

  const strictCandidateIndices = candidateIndices.filter((index) => {
    const refItem = referenceItems[index]
    return (
      refItem.itemType === "FilterItemComparison" &&
      filterItemComparisonStrictMatchKey(item) === filterItemComparisonStrictMatchKey(refItem)
    )
  })

  const onlyStrictCandidateIndex = findOnlyIndex(strictCandidateIndices)
  if (onlyStrictCandidateIndex === undefined) return undefined

  usedIndices.add(onlyStrictCandidateIndex)
  return referenceItems[onlyStrictCandidateIndex]
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
