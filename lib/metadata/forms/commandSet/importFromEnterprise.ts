import { Context } from "../../context/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const importCommandSetFromEnterprise = (
  _configurationSettings: Context,
  data: CommandSetEnterprise | undefined
): CommandSet | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
