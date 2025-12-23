import { ConfigurationSettings } from "../../configurationSettings/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  value: boolean | undefined
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
