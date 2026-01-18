import { importI8nTextFromXML } from "../../commonObjects/i8nText/importFromXML"
import { ConfigurationContext } from "../../context/types"
import { Command, Commands, CommandsXML, CommandXML } from "./types"

export default function importCommandFromXML(
  context: ConfigurationContext,
  xml: CommandXML | undefined
): Command | undefined {
  if (!xml) return undefined

  const result: Command = {
    name: xml._name,
    title: importI8nTextFromXML(context, xml.Title),
    toolTip: importI8nTextFromXML(context, xml.ToolTip),
    shortcut: xml.Shortcut,
    action: xml.Action,
    currentRowUse: xml.CurrentRowUse,
    modifiesSavedData: xml.ModifiesSavedData,
  }

  return result
}

export function importCommandsFromXML(context: ConfigurationContext, xml: CommandsXML | undefined): Commands {
  if (!xml) return []

  const xmlArray = Array.isArray(xml) ? xml : [xml]

  return xmlArray.map((commandXml) => importCommandFromXML(context, commandXml)!)
}
