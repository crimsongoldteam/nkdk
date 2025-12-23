import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const exportMetadataFieldToXML = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataField | undefined
): MetadataFieldXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export const exportMetadataFieldsToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataFields | undefined
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataFieldToXML(configurationSettings, value)!)
}
