import { ConfigurationContext } from "../../context/types"
import { CommandSet, CommandSetXML } from "./types"

export const exportCommandSetToXML = (
  _context: ConfigurationContext,
  data: CommandSet | undefined
): CommandSetXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandSetXML = []
  for (const command of data) {
    result.push({ ExcludedCommand: command })
  }

  return result
}
