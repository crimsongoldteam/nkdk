import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "../../../context/types"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"
import { PropertyRule } from "../../elements/calendarField/rules"

export const exportCommandInterfaceToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: CommandInterface | undefined
): CommandInterfaceXML | undefined => {
  if (!data) return undefined

  const result: CommandInterfaceXML = {}

  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.NavigationPanel = {
      Item: exportCommandInterfaceItemsToXML(context, undefined, data.NavigationPanel),
    }
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.CommandBar = {
      Item: exportCommandInterfaceItemsToXML(context, undefined, data.CommandBar),
    }
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportCommandInterfaceItemsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  items: CommandInterfaceItem[]
): CommandInterfaceItemXML[] => {
  return items.map((item, index) => exportCommandInterfaceItemToXML(context, undefined, item, index))
}

const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  item: CommandInterfaceItem,
  index: number
): CommandInterfaceItemXML => {
  const result: CommandInterfaceItemXML = {
    Command: item.command,
    Type: item.type ?? "Auto",
    Index: index,
    DefaultVisible: item.defaultVisible,
  }

  if (item.commandGroup) {
    result.CommandGroup = item.commandGroup
  }

  if (item.visible) {
    const visibleXML = exportUserVisibleToXML(context, undefined, item.visible)
    if (visibleXML) {
      result.Visible = visibleXML
    }
  }

  return result
}
