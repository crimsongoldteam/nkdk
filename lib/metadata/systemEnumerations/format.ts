import { TElementRule, TFormatFunction } from "~/lib/rulesManager/types"
import { TConfigurationSettings } from "../configurationSettings/types"

export const formatSystemEnumeration: TFormatFunction = (
  value: string | undefined,
  _configurationSettings: TConfigurationSettings,
  rule?: TElementRule
): string | undefined => {
  if (!rule) throw new Error("Rule not found")

  if (!value) return undefined

  const typeEnterprise = rule.typeEnterprise
  const type = rule.type

  if (!typeEnterprise || !type)
    throw new Error("Type enterprise or type not found")

  const index = type.options.findIndex(
    (option: string) => option.toLowerCase() === value.toLowerCase()
  )
  if (index === -1) throw new Error(`Value "${value}" not found in enum schema`)

  return typeEnterprise.options[index]
}
