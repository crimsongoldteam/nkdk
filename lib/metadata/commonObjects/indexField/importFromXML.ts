import { Context } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const importIndexFieldFromXML = (
  _configurationSettings: Context,
  xml: IndexFieldXML | undefined
): IndexField | undefined => {
  if (!xml) return undefined

  return xml.Name
}

export const importIndexFieldsFromXML = (
  configurationSettings: Context,
  xml: IndexFieldsXML | undefined
): IndexFields | undefined => {
  if (!xml) return undefined

  return xml.map((value) => importIndexFieldFromXML(configurationSettings, value)!)
}
