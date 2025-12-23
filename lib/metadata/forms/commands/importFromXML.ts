import { importI8nTextFromXML } from "../../commonObjects/i8nText/importFromXML"
import { Context } from "../../context/types"
import { Command, CommandXML } from "./types"

export default function importCommandFromXML(
  configurationSettings: Context,
  xml: CommandXML | undefined
): Command | undefined {
  if (!xml) return undefined

  const result: Command = {
    name: xml._name,
    id: xml._id,
    title: importI8nTextFromXML(configurationSettings, xml.Title),
    toolTip: importI8nTextFromXML(configurationSettings, xml.ToolTip),
    shortcut: xml.Shortcut,
    action: xml.Action,
    currentRowUse: xml.CurrentRowUse,
    modifiesSavedData: xml.ModifiesSavedData,
  }

  return result
}
