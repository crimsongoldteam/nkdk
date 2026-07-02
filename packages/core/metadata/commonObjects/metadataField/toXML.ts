import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { MetadataField, MetadataFields, MetadataFieldsXML } from "./types"

export const exportMetadataFieldToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataField | undefined
): string | undefined => {
  if (!data) return undefined

  return String(data)
}

export const exportMetadataFieldsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFields | undefined
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  const items = Array.isArray(data) ? data : [data]

  return {
    "xr:Field": items.map((value) => exportMetadataFieldToXML(context, undefined, value)!),
  }
}

const exportMetadataFieldOrFieldsToXML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataField | MetadataFields | undefined
): string | MetadataFieldsXML | undefined => {
  if (!data) return undefined
  return Array.isArray(data)
    ? exportMetadataFieldsToXML(context, rule, data)
    : exportMetadataFieldToXML(context, rule, data)
}

registerTypeRule("MetadataField", "exportToXML", exportMetadataFieldOrFieldsToXML)
registerTypeRule("MetadataFields", "exportToXML", exportMetadataFieldOrFieldsToXML)
