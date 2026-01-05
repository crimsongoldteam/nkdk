import { ConfigurationContext } from "../context/types"

export const exportSystemEnumerationToEnterprise = <T extends string>(
  _context: ConfigurationContext,
  value: string | undefined,
  enumeration: Record<string, string>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
