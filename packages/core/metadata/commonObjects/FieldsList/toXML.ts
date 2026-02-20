import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { FieldsList, FieldsListXML } from "./types"

export const exportFieldsListToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FieldsList | undefined
): FieldsListXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Field: data,
  }
}

registerTypeRule("FieldsList", "exportToXML", exportFieldsListToXML)
