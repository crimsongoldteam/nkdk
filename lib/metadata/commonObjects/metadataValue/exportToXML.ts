import { MetadataValue, MetadataValueXML } from "./types"

export const exportMetadataValueToXML = (data: MetadataValue | undefined): MetadataValueXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data.value,
    "_xsi:type": data.type,
  }
}

export const exportMetadataValuesToXML = (data: MetadataValue[] | undefined): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(value)!)
}
