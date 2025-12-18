import { ConfigurationSettings } from "../../configurationSettings/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const exportIndexFieldToXML = (
  data: IndexField | undefined,
  _configurationSettings: ConfigurationSettings
): IndexFieldXML | undefined => {
  if (!data) return undefined

  return { Name: data }
}

export const exportIndexFieldsToXML = (
  data: IndexFields | undefined,
  configurationSettings: ConfigurationSettings
): IndexFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportIndexFieldToXML(value, configurationSettings)!)
}
