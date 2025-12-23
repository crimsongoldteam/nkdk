import { ConfigurationSettings } from "../configurationSettings/types"

export const importSystemEnumerationFromEnterprise = <T extends string>(
  _configurationSettings: ConfigurationSettings,
  value: string | undefined,
  enumeration: Record<string, string>
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}

