import { TParseFunction } from "~/lib/rulesManager/types"
import { TConfigurationSettings } from "../../configurationSettings/types"
import { StringboolEnterprise } from "./types"

export const parseBoolean: TParseFunction = (
  value: StringboolEnterprise | undefined,
  _configurationSettings: TConfigurationSettings
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}
