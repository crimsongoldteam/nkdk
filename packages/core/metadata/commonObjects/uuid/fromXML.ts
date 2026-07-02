import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"

export const importUUIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return String(value)
}

registerTypeRule("uuid", "importFromXML", importUUIDFromXML)
