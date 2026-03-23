import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import type { I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import * as SE from "~/metadata/systemEnumerations/types"
import { importAppearanceFieldsFromDcsXML } from "../appearanceFields/fromDcsXML"
import type { AppearanceFields, AppearanceFieldsXML } from "../appearanceFields/types"
import { importFilterFromDcsXML } from "../filter/fromDcsXML"
import type { FilterXML } from "../filter/fromDcsXML"
import type { ConditionalAppearanceItem } from "./types"

type SelectionItemXML = { "dcsset:field": string }

type SelectionXML = {
  "dcsset:item"?: SelectionItemXML | SelectionItemXML[]
}

type ConditionalAppearanceItemXML = {
  "dcsset:use"?: string | boolean
  "dcsset:selection"?: SelectionXML
  "dcsset:filter"?: FilterXML
  "dcsset:appearance"?: AppearanceFieldsXML
  "dcsset:presentation"?: I8nTextXML
  "dcsset:viewMode"?: string
  "dcsset:userSettingID"?: string
  "dcsset:userSettingPresentation"?: I8nTextXML
  "dcsset:useInGroup"?: string
  "dcsset:useInHierarchicalGroup"?: string
  "dcsset:useInOverall"?: string
  "dcsset:useInFieldsHeader"?: string
  "dcsset:useInHeader"?: string
  "dcsset:useInParameters"?: string
  "dcsset:useInFilter"?: string
  "dcsset:useInResourceFieldsHeader"?: string
  "dcsset:useInOverallHeader"?: string
  "dcsset:useInOverallResourceFieldsHeader"?: string
}

export type ConditionalAppearanceXML = {
  "dcsset:item"?: ConditionalAppearanceItemXML | ConditionalAppearanceItemXML[]
}

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

const parseUse = (v: string | boolean | undefined): boolean | undefined => {
  if (v === undefined) return undefined
  if (typeof v === "boolean") return v
  if (v === "true" || v === "1") return true
  if (v === "false" || v === "0") return false
  return undefined
}

/** dcsset:selection — список имён полей данных; в модели лежит в том же представлении, что и для YAML (`_fieldNames`). */
const importSelectionFromDcsXML = (xml: SelectionXML | undefined): AppearanceFields | undefined => {
  if (!xml) return undefined
  const items = asArray(xml["dcsset:item"])
  if (items.length === 0) return undefined
  const fieldNames = items.map((item) => item["dcsset:field"]).filter(Boolean)
  return { itemType: "AppearanceFields" as const, _fieldNames: fieldNames } as unknown as AppearanceFields
}

const importConditionalAppearanceItemFromDcsXML = (
  context: ConfigurationContextFromXML,
  xml: ConditionalAppearanceItemXML
): ConditionalAppearanceItem => {
  const use = parseUse(xml["dcsset:use"])
  const fields = importSelectionFromDcsXML(xml["dcsset:selection"])
  const filter = importFilterFromDcsXML(context, xml["dcsset:filter"])
  const appearance =
    xml["dcsset:appearance"] !== undefined
      ? importAppearanceFieldsFromDcsXML(context, xml["dcsset:appearance"])
      : undefined
  const presentation =
    xml["dcsset:presentation"] !== undefined
      ? importI8nTextFromXML(context, { type: "I8nText" }, xml["dcsset:presentation"])
      : undefined
  const userSettingPresentation =
    xml["dcsset:userSettingPresentation"] !== undefined
      ? importI8nTextFromXML(context, { type: "I8nText" }, xml["dcsset:userSettingPresentation"])
      : undefined

  return {
    itemType: "ConditionalAppearanceItem",
    ...(use !== undefined ? { use } : {}),
    ...(fields !== undefined ? { fields } : {}),
    ...(filter !== undefined ? { filter } : {}),
    ...(appearance !== undefined ? { appearance } : {}),
    ...(presentation !== undefined ? { presentation } : {}),
    ...(xml["dcsset:viewMode"] !== undefined
      ? { viewMode: xml["dcsset:viewMode"] as SE.DataCompositionSettingsItemViewMode }
      : {}),
    ...(xml["dcsset:userSettingID"] ? { userSettingID: xml["dcsset:userSettingID"] } : {}),
    ...(userSettingPresentation !== undefined ? { userSettingPresentation } : {}),
    ...(xml["dcsset:useInGroup"] !== undefined
      ? { useInGroup: xml["dcsset:useInGroup"] as SE.DataCompositionConditionalAppearanceUse }
      : {}),
    ...(xml["dcsset:useInHierarchicalGroup"] !== undefined
      ? {
          useInHierarchicalGroup:
            xml["dcsset:useInHierarchicalGroup"] as SE.DataCompositionConditionalAppearanceUse,
        }
      : {}),
    ...(xml["dcsset:useInOverall"] !== undefined
      ? { useInOverall: xml["dcsset:useInOverall"] as SE.DataCompositionConditionalAppearanceUse }
      : {}),
    ...(xml["dcsset:useInFieldsHeader"] !== undefined
      ? {
          useInFieldsHeader:
            xml["dcsset:useInFieldsHeader"] as SE.DataCompositionConditionalAppearanceUse,
        }
      : {}),
    ...(xml["dcsset:useInHeader"] !== undefined
      ? { useInHeader: xml["dcsset:useInHeader"] as SE.DataCompositionConditionalAppearanceUse }
      : {}),
    ...(xml["dcsset:useInParameters"] !== undefined
      ? {
          useInParameters: xml["dcsset:useInParameters"] as SE.DataCompositionConditionalAppearanceUse,
        }
      : {}),
    ...(xml["dcsset:useInFilter"] !== undefined
      ? { useInFilter: xml["dcsset:useInFilter"] as SE.DataCompositionConditionalAppearanceUse }
      : {}),
    ...(xml["dcsset:useInResourceFieldsHeader"] !== undefined
      ? {
          useInResourceFieldsHeader:
            xml["dcsset:useInResourceFieldsHeader"] as SE.DataCompositionConditionalAppearanceUse,
        }
      : {}),
    ...(xml["dcsset:useInOverallHeader"] !== undefined
      ? {
          useInOverallHeader:
            xml["dcsset:useInOverallHeader"] as SE.DataCompositionConditionalAppearanceUse,
        }
      : {}),
    ...(xml["dcsset:useInOverallResourceFieldsHeader"] !== undefined
      ? {
          useInOverallResourceFieldsHeader:
            xml["dcsset:useInOverallResourceFieldsHeader"] as SE.DataCompositionConditionalAppearanceUse,
        }
      : {}),
  }
}

export const importConditionalAppearanceFromDcsXML = (
  context: ConfigurationContextFromXML,
  xml: ConditionalAppearanceXML
): ConditionalAppearanceItem[] => {
  return asArray(xml["dcsset:item"]).map((item) =>
    importConditionalAppearanceItemFromDcsXML(context, item)
  )
}
