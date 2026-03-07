import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { FieldsList, FieldsListXML } from "./types"

export const importFieldsListFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FieldsListXML | undefined
): FieldsList | undefined => {
  if (!xml || !xml.Field) return undefined

  return Array.isArray(xml.Field) ? xml.Field : [xml.Field]
}

registerTypeRule("FieldsList", "importFromXML", importFieldsListFromXML)
