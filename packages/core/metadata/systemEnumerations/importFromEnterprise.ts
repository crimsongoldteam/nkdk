import { ConfigurationContext } from "../context/types"

export const importSystemEnumerationFromYAML = <T extends string>(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined,
  enumeration: Record<string, T>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
