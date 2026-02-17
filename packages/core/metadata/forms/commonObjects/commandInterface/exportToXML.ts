import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"

export const exportCommandInterfaceToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CommandInterface | undefined
): CommandInterfaceXML | undefined => {
  if (!data) return undefined

  const result: CommandInterfaceXML = {}

  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.NavigationPanel = {
      Item: exportCommandInterfaceItemsToXML(context, data.NavigationPanel),
    }
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.CommandBar = {
      Item: exportCommandInterfaceItemsToXML(context, data.CommandBar),
    }
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportCommandInterfaceItemsToXML = (
  context: ConfigurationContext,
  items: CommandInterfaceItem[]
): CommandInterfaceItemXML[] => {
  return items.map((item, index) => exportCommandInterfaceItemToXML(context, item, index))
}

const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
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
    const visibleXML = exportUserVisibleToXML<CommandInterfaceItem>(
      context,
      { type: "UserVisible", yaml: "РазрешитьИспользование", yamlDeny: "ЗапретитьИспользование" },
      item.visible
    )
    if (visibleXML) {
      result.Visible = visibleXML
    }
  }

  return result
}

registerTypeRule("CommandInterface", "exportToXML", exportCommandInterfaceToXML)
