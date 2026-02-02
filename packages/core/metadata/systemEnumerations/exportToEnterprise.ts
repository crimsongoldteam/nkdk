import { ConfigurationContext } from "../context/types"

export const exportSystemEnumerationToYAML = <T extends string>(
  _context: ConfigurationContext,
  value: string | undefined,
  enumeration: Record<string, T>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
