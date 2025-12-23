import { Context } from "../../context/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const exportCommandSetToEnterprise = (
  _configurationSettings: Context,
  data: CommandSet | undefined
): CommandSetEnterprise | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
