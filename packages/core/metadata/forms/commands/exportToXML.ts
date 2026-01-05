import { exportI8nTextToXML } from "../../commonObjects/i8nText/exportToXML"
import { ConfigurationContext } from "../../context/types"
import { Command, CommandXML } from "./types"

export default function exportCommandToXML(
  context: ConfigurationContext,
  command: Command | undefined
): CommandXML | undefined {
  if (!command) return undefined

  const result: CommandXML = {
    _name: command.name,
    _id: command.id,
  }

  if (command.title !== undefined) {
    result.Title = exportI8nTextToXML(context, command.title)
  }

  if (command.toolTip !== undefined) {
    result.ToolTip = exportI8nTextToXML(context, command.toolTip)
  }

  if (command.shortcut !== undefined) {
    result.Shortcut = command.shortcut
  }

  if (command.action !== undefined) {
    result.Action = command.action
  }

  if (command.currentRowUse !== undefined) {
    result.CurrentRowUse = command.currentRowUse
  }

  if (command.modifiesSavedData !== undefined) {
    result.ModifiesSavedData = command.modifiesSavedData
  }

  return result
}
