import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { FieldsList, FieldsListXML } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"

export const exportFieldsListToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FieldsList | undefined
): FieldsListXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Field: data,
  }
}

registerTypeRule("FieldsList", "exportToXML", exportFieldsListToXML)
