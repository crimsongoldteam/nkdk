import { ConfigurationSettings } from "../../configurationSettings/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const exportCommandSetToEnterprise = (
  data: CommandSet | undefined,
  _configurationSettings: ConfigurationSettings
): CommandSetEnterprise | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
