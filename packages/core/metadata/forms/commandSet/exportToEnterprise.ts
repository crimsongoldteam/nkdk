import { ConfigurationContext } from "../../context/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const exportCommandSetToEnterprise = (
  _context: ConfigurationContext,
  data: CommandSet | undefined
): CommandSetEnterprise | undefined => {
  if (!data) return undefined

  return ["TODO"]
}
