import { ConfigurationSettings } from "../../configurationSettings/types"
import { Predefined, PredefinedItems, PredefinedItemsXML, PredefinedXML } from "./types"

export const exportPredefinedToXML = (
  _configurationSettings: ConfigurationSettings,
  data: Predefined | undefined
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
  configurationSettings: ConfigurationSettings,
  data: PredefinedItems | undefined
): PredefinedItemsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportPredefinedToXML(configurationSettings, value)!)
}
