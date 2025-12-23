import { ConfigurationSettings } from "../../configurationSettings/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const importCommandSetFromEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: CommandSetEnterprise | undefined
): CommandSet | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
