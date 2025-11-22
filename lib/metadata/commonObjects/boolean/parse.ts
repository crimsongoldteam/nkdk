import { TParseFunction } from "~/lib/rulesManager/types"
import { TConfigurationSettings } from "../../configurationSettings/types"
import { TBoolEnterprise } from "./types"

export const parseBoolean: TParseFunction = (
  value: TBoolEnterprise | undefined,
  _configurationSettings: TConfigurationSettings
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}
