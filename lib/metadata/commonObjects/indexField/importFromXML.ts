import { ConfigurationSettings } from "../../configurationSettings/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const importIndexFieldFromXML = (
  xml: IndexFieldXML | undefined,
  _configurationSettings: ConfigurationSettings
): IndexField | undefined => {
  if (!xml) return undefined

  return xml.Name
}

export const importIndexFieldsFromXML = (
  xml: IndexFieldsXML | undefined,
  configurationSettings: ConfigurationSettings
): IndexFields | undefined => {
  if (!xml) return undefined

  return xml.map((value) => importIndexFieldFromXML(value, configurationSettings)!)
}
