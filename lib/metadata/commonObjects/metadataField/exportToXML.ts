import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataField, MetadataFields, MetadataFieldsXML, MetadataFieldXML } from "./types"

export const exportMetadataFieldToXML = (
  data: MetadataField | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataFieldXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export const exportMetadataFieldsToXML = (
  data: MetadataFields | undefined,
  configurationSettings: ConfigurationSettings
): MetadataFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataFieldToXML(value, configurationSettings)!)
}
