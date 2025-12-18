import { ConfigurationSettings } from "../../configurationSettings/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const exportPredefinedToXML = (
  data: Predefined | undefined,
  _configurationSettings: ConfigurationSettings
): PredefinedXML | undefined => {
  if (!data) return undefined

  return {
    Name: data.name,
    Code: data.code,
    Description: data.description,
    IsFolder: data.isFolder,
  }
}

export const exportPredefinedItemsToXML = (
  data: PredefinedItems | undefined,
  configurationSettings: ConfigurationSettings
): PredefinedItemsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportPredefinedToXML(value, configurationSettings)!)
}
