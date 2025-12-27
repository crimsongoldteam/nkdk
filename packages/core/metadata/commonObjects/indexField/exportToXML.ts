import { Context } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const exportIndexFieldToXML = (_context: Context, data: IndexField | undefined): IndexFieldXML | undefined => {
  if (!data) return undefined

  return { Name: data }
}

export const exportIndexFieldsToXML = (context: Context, data: IndexFields | undefined): IndexFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportIndexFieldToXML(context, value)!)
}
