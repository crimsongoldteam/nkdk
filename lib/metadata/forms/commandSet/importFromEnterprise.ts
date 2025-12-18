import { ConfigurationSettings } from "../../configurationSettings/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const importCommandSetFromEnterprise = (
  data: CommandSetEnterprise | undefined,
  _configurationSettings: ConfigurationSettings
): CommandSet | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
