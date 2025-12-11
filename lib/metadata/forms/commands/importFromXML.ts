import { Command, CommandXML } from "./types"
import { importI8nTextFromXML } from "../../commonObjects/i8nText/importI8nTextFromXML"

export default function importCommandFromXML(
  xml: CommandXML | undefined
): Command | undefined {
  if (!xml) return undefined

  const result: Command = {
    name: xml._name,
    id: xml._id,
    title: importI8nTextFromXML(xml.Title),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    shortcut: xml.Shortcut,
    action: xml.Action,
    currentRowUse: xml.CurrentRowUse,
    modifiesSavedData: xml.ModifiesSavedData,
  }

  return result
}
