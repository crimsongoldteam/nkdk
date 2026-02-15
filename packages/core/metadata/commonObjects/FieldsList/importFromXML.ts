import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { FieldsList, FieldsListXML } from "./types"

export const importFieldsListFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: FieldsListXML | undefined
): FieldsList | undefined => {
  if (!xml || !xml.Field) return undefined

  return Array.isArray(xml.Field) ? xml.Field : [xml.Field]
}

registerTypeRule("FieldsList", "importFromXML", importFieldsListFromXML)
