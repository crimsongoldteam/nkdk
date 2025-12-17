import { ConfigurationSettings } from "../configurationSettings/types"

export const exportSystemEnumerationToEnterprise = <T extends string>(
  value: string | undefined,
  enumeration: Record<string, string>,
  _configurationSettings: ConfigurationSettings
): T | undefined => {
  if (!value) return undefined

  return enumeration[value] as T
}
