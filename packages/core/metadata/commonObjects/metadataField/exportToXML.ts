import { Context } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML } from "./types"

export const exportMetadataFieldToXML = (_context: Context, data: MetadataField | undefined): string | undefined => {
  if (!data) return undefined

  return String(data)
}

export const exportMetadataFieldsToXML = (
  context: Context,
  data: MetadataFields | undefined
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  const items = Array.isArray(data) ? data : [data]

  return {
    "xr:Field": items.map((value) => exportMetadataFieldToXML(context, value)!),
  }
}
