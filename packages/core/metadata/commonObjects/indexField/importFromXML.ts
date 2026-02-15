import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const importIndexFieldFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: IndexFieldXML | undefined
): IndexField | undefined => {
  if (!xml) return undefined

  return xml.Name
}

export const importIndexFieldsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: IndexFieldsXML | undefined
): IndexFields | undefined => {
  if (!xml) return undefined

  return xml.map((value) => importIndexFieldFromXML(context, undefined, value)!)
}

registerTypeRule("IndexField", "importFromXML", importIndexFieldFromXML)
