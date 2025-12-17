import { TConfigurationSettings } from "../../configurationSettings/types"
import { StringboolEnterprise } from "./types"

export const parseBoolean = (
  value: StringboolEnterprise | undefined,
  _configurationSettings: TConfigurationSettings
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}
