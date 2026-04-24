import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { IndexFields, IndexFieldsXML } from "./types"

export const exportIndexFieldsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: IndexFields | undefined
): IndexFieldsXML | undefined => {
  if (!data || data.length === 0) return undefined
  return { Field: data.length === 1 ? data[0]! : data }
}

registerTypeRule("IndexField", "exportToXML", exportIndexFieldsToXML)
