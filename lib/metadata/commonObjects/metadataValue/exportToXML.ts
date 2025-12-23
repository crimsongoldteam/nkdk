import { Context } from "../../context/types"
import { MetadataValue, MetadataValueXML } from "./types"

export const exportMetadataValueToXML = (
  _configurationSettings: Context,
  data: MetadataValue | undefined
): MetadataValueXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data.value,
    "_xsi:type": data.type,
  }
}

export const exportMetadataValuesToXML = (
  configurationSettings: Context,
  data: MetadataValue[] | undefined
): MetadataValueXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataValueToXML(configurationSettings, value)!)
}
