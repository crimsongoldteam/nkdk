import { MetadataValue, MetadataValueXML } from "./types"

export const importMetadataValueFromXML = (data: MetadataValueXML | undefined): MetadataValue | undefined => {
  if (!data) return undefined

  return {
    type: data["_xsi:type"],
    value: data["#text"],
  }
}

export const importMetadataValuesFromXML = (data: MetadataValueXML[] | undefined): MetadataValue[] | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataValueFromXML(value)!)
}
