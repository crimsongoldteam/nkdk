import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/fromXML"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"

export const importCommandInterfaceFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: CommandInterfaceXML | undefined
): CommandInterface | undefined => {
  if (!xml) return undefined

  const result: CommandInterface = {
    NavigationPanel: [],
    CommandBar: [],
    itemType: "CommandInterface",
  }

  if (xml.NavigationPanel?.Item) {
    const items = Array.isArray(xml.NavigationPanel.Item) ? xml.NavigationPanel.Item : [xml.NavigationPanel.Item]
    result.NavigationPanel = items
      .sort((a, b) => (a.Index ?? 0) - (b.Index ?? 0))
      .map((item) => importCommandInterfaceItemFromXML(context, item))
  }

  if (xml.CommandBar?.Item) {
    const items = Array.isArray(xml.CommandBar.Item) ? xml.CommandBar.Item : [xml.CommandBar.Item]
    result.CommandBar = items
      .sort((a, b) => (a.Index ?? 0) - (b.Index ?? 0))
      .map((item) => importCommandInterfaceItemFromXML(context, item))
  }

  return result
}

const importCommandInterfaceItemFromXML = (
  context: ConfigurationContext,
  item: CommandInterfaceItemXML
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Command,
    type: item.Type,
    defaultVisible: item.DefaultVisible ?? true,
    itemType: "CommandInterfaceItem",
  }

  if (item.CommandGroup) {
    result.commandGroup = item.CommandGroup
  }

  if (item.Visible) {
    const visible = importUserVisibleFromXML(context, undefined, item.Visible)
    if (visible) {
      result.visible = visible
    }
  }

  return result
}

registerTypeRule("CommandInterface", "importFromXML", importCommandInterfaceFromXML)
