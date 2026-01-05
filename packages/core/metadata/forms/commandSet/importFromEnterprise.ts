import { ConfigurationContext } from "../../context/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const importCommandSetFromEnterprise = (
  _context: ConfigurationContext,
  data: CommandSetEnterprise | undefined
): CommandSet | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
