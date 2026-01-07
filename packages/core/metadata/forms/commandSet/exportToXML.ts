import { ConfigurationContext } from "../../context/types"
import { CommandSet, CommandSetXML } from "./types"

export const exportCommandSetToXML = (
  _context: ConfigurationContext,
  data: CommandSet | undefined
): CommandSetXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: string[] = []
  for (const command of data) {
    if (command !== undefined && command !== null && command.length > 0) {
      result.push(command)
    }
  }

  if (result.length === 0) return undefined

  return {
    ExcludedCommand: result.length === 1 ? result[0] : result,
  }
}
