import { Context } from "../../context/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (
  _context: Context,
  data: MetadataFieldXML | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  return data["#text"]
}

export const importMetadataFieldsFromXML = (
  _context: Context,
  data: MetadataFieldsXML | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return undefined

  // return data.map((value) => importMetadataFieldFromXML(context, value)!)
}
