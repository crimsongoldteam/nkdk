import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataFieldXML | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  return data["#text"]
}

export const importMetadataFieldsFromXML = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataFieldsXML | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return undefined

  // return data.map((value) => importMetadataFieldFromXML(configurationSettings, value)!)
}
