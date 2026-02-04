import { ConfigurationContext } from "~/metadata/context/types"
import { FunctionalOptions, FunctionalOptionsXML } from "./types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"

export const exportFunctionalOptionsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FunctionalOptions | undefined
): FunctionalOptionsXML | undefined => {
  if (!data || data.length === 0) return undefined

  return {
    Item: data.length === 1 ? data[0] : data,
  }
}


registerTypeRule("FunctionalOptionsProperty", "exportToXML", exportToXML)