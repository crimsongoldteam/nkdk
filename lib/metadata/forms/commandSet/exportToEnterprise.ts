import { ConfigurationSettings } from "../../configurationSettings/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const exportCommandSetToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: CommandSet | undefined
): CommandSetEnterprise | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
