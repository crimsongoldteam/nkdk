import { Context } from "../context/types"

export const importSystemEnumerationFromEnterprise = <T extends string>(
  _configurationSettings: Context,
  value: string | undefined,
  enumeration: Record<string, string>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
