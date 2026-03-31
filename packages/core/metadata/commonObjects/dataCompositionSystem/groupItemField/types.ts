import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { importGroupItemAutoFromYAML } from "../groupItemAuto/fromYAML"
import { GroupItemAutoRules } from "../groupItemAuto/rules"
import { exportGroupItemAutoToXML } from "../groupItemAuto/toXML"
import { exportGroupItemAutoToYAML } from "../groupItemAuto/toYAML"
import type { GroupItemAuto, GroupItemAutoYAML } from "../groupItemAuto/types"
import { importGroupItemFieldFromXML } from "./fromXML"
import { importGroupItemFieldFromYAML } from "./fromYAML"
import { GroupItemFieldRules } from "./rules"
import { exportGroupItemFieldToXML } from "./toXML"
import { exportGroupItemFieldToYAML } from "./toYAML"

export type GroupItemField = MetadataTypeByRule<typeof GroupItemFieldRules>
export type GroupItemFieldYAML = string

export type GroupItem = (GroupItemField | GroupItemAuto)[]
export type GroupItemYAML = (GroupItemFieldYAML | GroupItemAutoYAML)[]

const importGroupItemCollectionFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): GroupItem | undefined => {
  if (!xml) return undefined
  const items = Array.isArray(xml) ? xml : [xml]
  const result: GroupItem = []
  for (const item of items) {
    if (!item || typeof item !== "object") continue
    const xsiType = (item as Record<string, unknown>)["_xsi:type"]
    if (xsiType === "dcsset:GroupItemField") {
      const r = importGroupItemFieldFromXML(context, _rule, item)
      if (r) result.push(r)
    } else if (xsiType === "dcsset:GroupItemAuto") {
      const r = importMetadataItemFromXML({ context, xml: item, rule: GroupItemAutoRules })
      if (r) result.push(r as GroupItemAuto)
    }
  }
  return result.length > 0 ? result : undefined
}

const importGroupItemCollectionFromYAML = (
  context: unknown,
  rule: PropertyRule,
  value: unknown
): GroupItem | undefined => {
  if (!value || !Array.isArray(value)) return undefined
  const result: GroupItem = []
  for (const item of value) {
    if (typeof item !== "string") continue
    if (item === "[Авто]" || item === "([Авто])") {
      const r = importGroupItemAutoFromYAML(context as any, rule, item)
      if (r) result.push(r)
    } else {
      const r = importGroupItemFieldFromYAML(context as any, rule, item)
      if (r) result.push(r)
    }
  }
  return result.length > 0 ? result : undefined
}

const exportGroupItemCollectionToYAML = (
  context: unknown,
  rule: PropertyRule,
  value: unknown
): GroupItemYAML | undefined => {
  if (!value || !Array.isArray(value) || value.length === 0) return undefined
  const result = (value as GroupItem).flatMap((item) => {
    if (item.itemType === "GroupItemAuto") {
      const r = exportGroupItemAutoToYAML(context as any, rule, item)
      return r != null ? [r] : []
    }
    if (item.itemType === "GroupItemField") {
      const r = exportGroupItemFieldToYAML(context as any, rule, item)
      return r != null ? [r] : []
    }
    return []
  })
  return result.length > 0 ? result : undefined
}

const exportGroupItemCollectionToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  referenceMetadata?: unknown
}): unknown => {
  const { context, rule, value, referenceMetadata } = params
  if (!value || !Array.isArray(value) || value.length === 0) return undefined
  const refItems = Array.isArray(referenceMetadata) ? (referenceMetadata as GroupItem) : []
  const result = (value as GroupItem).flatMap((item, i) => {
    const ref = refItems[i]
    if (item.itemType === "GroupItemField") {
      const r = exportGroupItemFieldToXML(context, rule, item, ref?.itemType === "GroupItemField" ? ref : undefined)
      return r ? [r] : []
    }
    if (item.itemType === "GroupItemAuto") {
      const r = exportGroupItemAutoToXML(context, rule, item, ref?.itemType === "GroupItemAuto" ? ref : undefined)
      return r ? [r] : []
    }
    return []
  })
  return result.length > 0 ? result : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "GroupItem",
  itemRule: GroupItemFieldRules,
  xmlElement: "dcsset:item",
  yamlAsArray: true,
  fromXML: importGroupItemCollectionFromXML as any,
  fromYAML: importGroupItemCollectionFromYAML as any,
  toYAML: exportGroupItemCollectionToYAML as any,
  toXML: exportGroupItemCollectionToXML as any,
})
