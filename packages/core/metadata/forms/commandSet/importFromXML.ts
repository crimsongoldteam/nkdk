import { ConfigurationContext } from "../../context/types"
import { CommandSet, CommandSetXML } from "./types"

export const importCommandSetFromXML = (
  _context: ConfigurationContext,
  xml: CommandSetXML | undefined
): CommandSet | undefined => {
  if (!xml) return undefined

  const result: CommandSet = []
  for (const command of xml) {
    result.push(command.ExcludedCommand)
  }

  return result.length > 0 ? result : undefined
}
