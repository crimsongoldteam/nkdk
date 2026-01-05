import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const importIndexFieldFromXML = (
  _context: ConfigurationContext,
  xml: IndexFieldXML | undefined
): IndexField | undefined => {
  if (!xml) return undefined

  return xml.Name
}

export const importIndexFieldsFromXML = (
  context: ConfigurationContext,
  xml: IndexFieldsXML | undefined
): IndexFields | undefined => {
  if (!xml) return undefined

  return xml.map((value) => importIndexFieldFromXML(context, value)!)
}
