import { type } from "os"
import { TConfigurationSettings } from "../configurationSettings/types"

export const formatSystemEnumeration = (
  value: string | undefined,
  _configurationSettings: TConfigurationSettings
): string | undefined => {
  if (!value) return undefined

  const index = Object.keys(type).indexOf(value)

  if (index === -1) throw new Error(`Value "${value}" not found in enum schema`)

  return Object.keys(typeEnterprise)[index]
}
