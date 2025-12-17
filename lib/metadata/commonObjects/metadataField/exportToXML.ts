import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const exportMetadataFieldToXML = (data: MetadataField | undefined): MetadataFieldXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export const exportMetadataFieldsToXML = (data: MetadataFields | undefined): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataFieldToXML(value)!)
}
