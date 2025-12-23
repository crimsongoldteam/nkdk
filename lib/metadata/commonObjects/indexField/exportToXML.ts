import { ConfigurationSettings } from "../../configurationSettings/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const exportIndexFieldToXML = (
  _configurationSettings: ConfigurationSettings,
  data: IndexField | undefined
): IndexFieldXML | undefined => {
  if (!data) return undefined

  return { Name: data }
}

export const exportIndexFieldsToXML = (
  configurationSettings: ConfigurationSettings,
  data: IndexFields | undefined
): IndexFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportIndexFieldToXML(configurationSettings, value)!)
}
