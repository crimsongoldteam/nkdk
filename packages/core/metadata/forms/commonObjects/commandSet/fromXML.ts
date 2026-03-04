import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { ConfigurationContext } from "../../../context/types"
import { CommandSet, CommandSetXML } from "./types"

export const importCommandSetFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: CommandSetXML | undefined
): CommandSet | undefined => {
  if (!xml) return undefined

  const excludedCommands = xml.ExcludedCommand
  if (excludedCommands === undefined) return undefined

  const result: CommandSet = []
  const commands = Array.isArray(excludedCommands) ? excludedCommands : [excludedCommands]

  for (const command of commands) {
    if (command !== undefined && command !== null && command.length > 0) {
      result.push(command)
    }
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("CommandSet", "importFromXML", importCommandSetFromXML)
