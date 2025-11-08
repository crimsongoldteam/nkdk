import { TCommand, TCommandXML } from "./types"
import { exportI8nTextToXML } from "../../commonObjects/i8nText/exportI8nTextToXML"

export default function exportCommandToXML(
  command: TCommand | undefined
): TCommandXML | undefined {
  if (!command) return undefined

  const result: TCommandXML = {
    _name: command.name,
    _id: command.id,
  }

  if (command.title !== undefined) {
    result.Title = exportI8nTextToXML(command.title)
  }

  if (command.toolTip !== undefined) {
    result.ToolTip = exportI8nTextToXML(command.toolTip)
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
