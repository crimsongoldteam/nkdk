import { Context } from "../context/types"

export const importSystemEnumerationFromEnterprise = <T extends string>(
  _context: Context,
  value: string | undefined,
  enumeration: Record<string, string>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
