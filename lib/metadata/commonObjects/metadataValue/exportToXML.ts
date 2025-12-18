import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataValue, MetadataValueXML } from "./types"

export const exportMetadataValueToXML = (
  data: MetadataValue | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataValueXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data.value,
    "_xsi:type": data.type,
  }
}

export const exportMetadataValuesToXML = (
  data: MetadataValue[] | undefined,
  configurationSettings: ConfigurationSettings
): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(value, configurationSettings)!)
}
