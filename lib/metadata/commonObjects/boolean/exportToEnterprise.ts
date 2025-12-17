import { ConfigurationSettings } from "../../configurationSettings/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (
  value: boolean | undefined,
  _configurationSettings: ConfigurationSettings
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
