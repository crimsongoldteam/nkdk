import type { I8nTextLanguageXML } from "~/metadata/commonObjects/i8nText/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import * as SE from "~/metadata/systemEnumerations/types"
import type { FilterItem, FilterItemComparison } from "../filterItem/types"
import type { FilterItemGroup } from "../filterItemGroup/types"
import type { Filter } from "./types"

type TextWithXsiType = { "_xsi:type": string; "#text": string | boolean }

type PresentationXML = { "_xsi:type": string; "v8:item": I8nTextLanguageXML | I8nTextLanguageXML[] }

type FilterItemComparisonXML = {
  "_xsi:type": "dcsset:FilterItemComparison"
  "dcsset:use"?: boolean
  "dcsset:left"?: TextWithXsiType
  "dcsset:comparisonType"?: SE.DataCompositionComparisonType
  "dcsset:right"?: TextWithXsiType
  "dcsset:presentation"?: PresentationXML
  "dcsset:application"?: SE.DataCompositionFilterApplicationType
  "dcsset:viewMode"?: SE.DataCompositionSettingsItemViewMode
  "dcsset:userSettingID"?: string
}

type FilterItemGroupXML = {
  "_xsi:type": "dcsset:FilterItemGroup"
  "dcsset:use"?: boolean
  "dcsset:groupType"?: SE.DataCompositionFilterItemsGroupType
  "dcsset:item"?: FilterItemXMLOut | FilterItemXMLOut[]
  "dcsset:presentation"?: string
  "dcsset:application"?: SE.DataCompositionFilterApplicationType
  "dcsset:viewMode"?: SE.DataCompositionSettingsItemViewMode
  "dcsset:userSettingID"?: string
}

type FilterItemXMLOut = FilterItemComparisonXML | FilterItemGroupXML

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const makeFieldRef = (value: string): TextWithXsiType => ({
  "_xsi:type": "dcscor:Field",
  "#text": value,
})

const makeRightValue = (value: string): TextWithXsiType => {
  if (value === "true" || value === "false") {
    return { "_xsi:type": "xs:boolean", "#text": value === "true" }
  }
  return { "_xsi:type": "dcscor:Field", "#text": value }
}

const makePresentationXML = (lang: string, value: string): PresentationXML => ({
  "_xsi:type": "v8:LocalStringType",
  "v8:item": [{ "v8:lang": lang, "v8:content": value }],
})

const exportFilterItemToDcsXML = (
  context: ConfigurationContext,
  item: FilterItem
): FilterItemXMLOut => {
  if (item.itemType === "FilterItemGroup") {
    const g = item as FilterItemGroup
    const childItems = asArray(g.items as FilterItem | FilterItem[] | undefined).map((child) =>
      exportFilterItemToDcsXML(context, child)
    )
    const result: FilterItemGroupXML = {
      "_xsi:type": "dcsset:FilterItemGroup",
      ...(g.use !== undefined ? { "dcsset:use": g.use } : {}),
      ...(g.groupType !== undefined ? { "dcsset:groupType": g.groupType } : {}),
      ...(childItems.length > 0
        ? { "dcsset:item": childItems.length === 1 ? childItems[0] : childItems }
        : {}),
      ...(g.presentation ? { "dcsset:presentation": g.presentation } : {}),
      ...(g.application !== undefined ? { "dcsset:application": g.application } : {}),
      ...(g.viewMode !== undefined ? { "dcsset:viewMode": g.viewMode } : {}),
      ...(g.userSettingID ? { "dcsset:userSettingID": g.userSettingID } : {}),
    }
    return result
  }

  const c = item as FilterItemComparison
  const result: FilterItemComparisonXML = {
    "_xsi:type": "dcsset:FilterItemComparison",
    ...(c.use !== undefined ? { "dcsset:use": c.use } : {}),
    ...(c.leftValue ? { "dcsset:left": makeFieldRef(c.leftValue) } : {}),
    ...(c.comparisonType !== undefined ? { "dcsset:comparisonType": c.comparisonType } : {}),
    ...(c.rightValue !== undefined ? { "dcsset:right": makeRightValue(c.rightValue) } : {}),
    ...(c.presentation
      ? { "dcsset:presentation": makePresentationXML(context.defaultLanguage, c.presentation) }
      : {}),
    ...(c.application !== undefined ? { "dcsset:application": c.application } : {}),
    ...(c.viewMode !== undefined ? { "dcsset:viewMode": c.viewMode } : {}),
    ...(c.userSettingID ? { "dcsset:userSettingID": c.userSettingID } : {}),
  }
  return result
}

export const exportFilterToDcsXML = (
  context: ConfigurationContext,
  filter: Filter | undefined
): Record<string, unknown> | undefined => {
  if (!filter) return undefined
  const items = asArray(filter.items as FilterItem | FilterItem[] | undefined).map((item) =>
    exportFilterItemToDcsXML(context, item)
  )
  if (items.length === 0) return {}
  return { "dcsset:item": items.length === 1 ? items[0] : items }
}
