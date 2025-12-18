import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const importMetadataFieldFromXML = (
  data: MetadataFieldXML | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataField | undefined => {
  if (!data) return undefined

  return data["#text"]
}

export const importMetadataFieldsFromXML = (
  data: MetadataFieldsXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataFieldFromXML(value, configurationSettings)!)
}
