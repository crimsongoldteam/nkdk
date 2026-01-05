import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const exportIndexFieldToXML = (
  _context: ConfigurationContext,
  data: IndexField | undefined
): IndexFieldXML | undefined => {
  if (!data) return undefined

  return { Name: data }
}

export const exportIndexFieldsToXML = (
  context: ConfigurationContext,
  data: IndexFields | undefined
): IndexFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportIndexFieldToXML(context, value)!)
}
