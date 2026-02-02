import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { IndexField, IndexFields, IndexFieldsXML, IndexFieldXML } from "./types"

export const _importIndexFieldFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  xml: IndexFieldXML | undefined
): IndexField | undefined => {
  if (!xml) return undefined

  return xml.Name
}

export const _importIndexFieldsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  xml: IndexFieldsXML | undefined
): IndexFields | undefined => {
  if (!xml) return undefined

  return xml.map((value) => _importIndexFieldFromXML(context, _rule, value)!)
}
