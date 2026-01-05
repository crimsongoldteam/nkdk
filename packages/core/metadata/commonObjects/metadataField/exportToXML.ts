import { ConfigurationContext } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML } from "./types"

export const exportMetadataFieldToXML = (
  _context: ConfigurationContext,
  data: MetadataField | undefined
): string | undefined => {
  if (!data) return undefined

  return String(data)
}

export const exportMetadataFieldsToXML = (
  context: ConfigurationContext,
  data: MetadataFields | undefined
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  const items = Array.isArray(data) ? data : [data]

  return {
    "xr:Field": items.map((value) => exportMetadataFieldToXML(context, value)!),
  }
}
