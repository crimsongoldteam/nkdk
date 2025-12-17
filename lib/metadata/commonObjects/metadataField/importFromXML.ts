import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (data: MetadataFieldXML | undefined): MetadataField | undefined => {
  if (!data) return undefined

  return data["#text"]
}

export const importMetadataFieldsFromXML = (data: MetadataFieldsXML | undefined): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataFieldFromXML(value)!)
}
