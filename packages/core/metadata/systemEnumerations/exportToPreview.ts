import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"
import { SystemEnumerationPreview } from "./types"

export const exportSystemEnumerationToPreview = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined,
  enumerationName: string
): SystemEnumerationPreview | undefined => {
  if (!value) return undefined
  return {
    Type: "SystemEnumeration",
    Value: `${enumerationName}.${value}`,
  }
}
