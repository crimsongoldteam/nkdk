import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import type { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import * as SE from "~/metadata/systemEnumerations/types"
import type { FilterItem, FilterItemComparison } from "../filterItem/types"
import type { FilterItemGroup } from "../filterItemGroup/types"
import type { Filter } from "./types"

type TextOrTyped =
  | string
  | boolean
  | number
  | { "_xsi:type"?: string; "#text"?: string | number | boolean }

type FilterItemComparisonXML = {
  "_xsi:type"?: string
  "dcsset:use"?: string | boolean
  "dcsset:left"?: TextOrTyped
  "dcsset:comparisonType"?: string
  "dcsset:right"?: TextOrTyped
  "dcsset:presentation"?: I8nTextXML & { "_xsi:type"?: string }
  "dcsset:application"?: string
  "dcsset:viewMode"?: string
  "dcsset:userSettingID"?: string
  "dcsset:userSettingPresentation"?: I8nTextXML | string
}

type FilterItemGroupXML = {
  "_xsi:type"?: string
  "dcsset:use"?: string | boolean
  "dcsset:groupType"?: string
  "dcsset:item"?: FilterItemXML | FilterItemXML[]
  "dcsset:presentation"?: string
  "dcsset:application"?: string
  "dcsset:viewMode"?: string
  "dcsset:userSettingID"?: string
  "dcsset:userSettingPresentation"?: string
}

type FilterItemXML = FilterItemComparisonXML | FilterItemGroupXML

export type FilterXML = {
  "dcsset:item"?: FilterItemXML | FilterItemXML[]
}

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const extractText = (value: TextOrTyped | undefined): string | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "string") return value
  if (typeof value === "boolean" || typeof value === "number") return String(value)
  const t = (value as { "#text"?: unknown })["#text"]
  if (t !== undefined) return String(t)
  return undefined
}

const parseUse = (v: string | boolean | undefined): boolean | undefined => {
  if (v === undefined) return undefined
  if (typeof v === "boolean") return v
  if (v === "true" || v === "1") return true
  if (v === "false" || v === "0") return false
  return undefined
}

const importFilterItemFromDcsXML = (context: ConfigurationContextFromXML, xml: FilterItemXML): FilterItem => {
  const xsiType = (xml as { "_xsi:type"?: string })["_xsi:type"]

  if (xsiType === "dcsset:FilterItemGroup") {
    const g = xml as FilterItemGroupXML
    const use = parseUse(g["dcsset:use"])
    const childItems = asArray(g["dcsset:item"]).map((item) => importFilterItemFromDcsXML(context, item))
    const result: FilterItemGroup = {
      itemType: "FilterItemGroup",
      ...(use !== undefined ? { use } : {}),
      ...(g["dcsset:groupType"] !== undefined
        ? { groupType: g["dcsset:groupType"] as SE.DataCompositionFilterItemsGroupType }
        : {}),
      ...(childItems.length > 0
        ? { items: (childItems.length === 1 ? childItems[0] : childItems) as FilterItem }
        : {}),
      ...(typeof g["dcsset:presentation"] === "string" && g["dcsset:presentation"]
        ? { presentation: g["dcsset:presentation"] }
        : {}),
      ...(g["dcsset:application"] !== undefined
        ? { application: g["dcsset:application"] as SE.DataCompositionFilterApplicationType }
        : {}),
      ...(g["dcsset:viewMode"] !== undefined
        ? { viewMode: g["dcsset:viewMode"] as SE.DataCompositionSettingsItemViewMode }
        : {}),
      ...(g["dcsset:userSettingID"] !== undefined ? { userSettingID: String(g["dcsset:userSettingID"]) } : {}),
    }
    return result
  }

  const c = xml as FilterItemComparisonXML
  const use = parseUse(c["dcsset:use"])
  const leftValue = extractText(c["dcsset:left"])
  const rightValue = extractText(c["dcsset:right"])

  let presentation: string | undefined
  const presRaw = c["dcsset:presentation"]
  if (presRaw !== undefined) {
    if (typeof presRaw === "string") {
      presentation = presRaw
    } else {
      const i8n = importI8nTextFromXML(context, { type: "I8nText" }, presRaw as I8nTextXML)
      if (i8n) {
        presentation = i8n.items[context.defaultLanguage] ?? Object.values(i8n.items)[0]
      }
    }
  }

  const result: FilterItemComparison = {
    itemType: "FilterItemComparison",
    ...(use !== undefined ? { use } : {}),
    ...(leftValue !== undefined ? { leftValue } : {}),
    ...(c["dcsset:comparisonType"] !== undefined
      ? { comparisonType: c["dcsset:comparisonType"] as SE.DataCompositionComparisonType }
      : {}),
    ...(rightValue !== undefined ? { rightValue } : {}),
    ...(presentation !== undefined ? { presentation } : {}),
    ...(c["dcsset:application"] !== undefined
      ? { application: c["dcsset:application"] as SE.DataCompositionFilterApplicationType }
      : {}),
    ...(c["dcsset:viewMode"] !== undefined
      ? { viewMode: c["dcsset:viewMode"] as SE.DataCompositionSettingsItemViewMode }
      : {}),
    ...(c["dcsset:userSettingID"] !== undefined ? { userSettingID: String(c["dcsset:userSettingID"]) } : {}),
  }
  return result
}

export const importFilterFromDcsXML = (
  context: ConfigurationContextFromXML,
  xml: FilterXML | undefined
): Filter | undefined => {
  if (!xml) return undefined
  const items = asArray(xml["dcsset:item"]).map((item) => importFilterItemFromDcsXML(context, item))
  return {
    itemType: "Filter",
    ...(items.length > 0 ? { items: (items.length === 1 ? items[0] : items) as FilterItem } : {}),
  }
}
