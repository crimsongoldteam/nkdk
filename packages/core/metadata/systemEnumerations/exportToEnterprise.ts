import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms/elements/calendarField/rules"

export const exportSystemEnumerationToYAML = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined,
  enumeration: Record<string, T>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
