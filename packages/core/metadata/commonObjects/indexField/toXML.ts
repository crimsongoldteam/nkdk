import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const exportIndexFieldToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: IndexField | undefined
): IndexFieldXML | undefined => {
  if (!data) return undefined

  return { Name: data }
}

export const exportIndexFieldsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: IndexFields | undefined
): IndexFieldsXML | undefined => {
  if (!data) return undefined

  return data.map((value) => exportIndexFieldToXML(context, undefined, value)!)
}

registerTypeRule("IndexField", "exportToXML", exportIndexFieldToXML)
