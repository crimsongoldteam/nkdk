import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"

export const importStringFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: string | number | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return value.toString()
}

registerTypeRule("string", "importFromXML", importStringFromXML)
