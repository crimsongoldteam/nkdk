import { exportI8nTextToXML } from "../../commonObjects/i8nText/exportToXML"
import { ConfigurationSettings } from "../../configurationSettings/types"
import { Command, CommandXML } from "./types"

export default function exportCommandToXML(
  command: Command | undefined,
  configurationSettings: ConfigurationSettings
): CommandXML | undefined {
  if (!command) return undefined

  const result: CommandXML = {
    _name: command.name,
    _id: command.id,
  }

  if (command.title !== undefined) {
    result.Title = exportI8nTextToXML(command.title, configurationSettings)
  }

  if (command.toolTip !== undefined) {
    result.ToolTip = exportI8nTextToXML(command.toolTip, configurationSettings)
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
