import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const exportMetadataCommandGroupToXML = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export const exportMetadataCommandGroupsToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommandGroup[] | undefined
): MetadataCommandGroupXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataCommandGroupToXML(configurationSettings, value)!)
}
