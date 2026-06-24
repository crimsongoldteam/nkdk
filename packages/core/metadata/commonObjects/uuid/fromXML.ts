import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"

export const importUUIDFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  if (value === undefined) return undefined
  return String(value)
}

registerTypeRule("uuid", "importFromXML", importUUIDFromXML)
