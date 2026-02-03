import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML } from "./types"

export const _exportMetadataFieldToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataField | undefined
): string | undefined => {
  if (!data) return undefined

  return String(data)
}

export const _exportMetadataFieldsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFields | undefined
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  const items = Array.isArray(data) ? data : [data]

  return {
    "xr:Field": items.map((value) => _exportMetadataFieldToXML(context, undefined, _rule, value)!),
  }
}
