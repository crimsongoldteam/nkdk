import { importI8nTextFromXML } from "../../commonObjects/i8nText/importFromXML"
import { ConfigurationSettings } from "../../configurationSettings/types"
import { Command, CommandXML } from "./types"

export default function importCommandFromXML(
  xml: CommandXML | undefined,
  configurationSettings: ConfigurationSettings
): Command | undefined {
  if (!xml) return undefined

  const result: Command = {
    name: xml._name,
    id: xml._id,
    title: importI8nTextFromXML(xml.Title, configurationSettings),
    toolTip: importI8nTextFromXML(xml.ToolTip, configurationSettings),
    shortcut: xml.Shortcut,
    action: xml.Action,
    currentRowUse: xml.CurrentRowUse,
    modifiesSavedData: xml.ModifiesSavedData,
  }

  return result
}
