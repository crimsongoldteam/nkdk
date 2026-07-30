import { exportUserVisibleToXML } from "../../../commonObjects/userVisible/toXML"
import { registerTypeRule } from "../../../orchestration"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"

export const exportCommandInterfaceToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterface | undefined,
  _referenceData?: CommandInterface | undefined
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
  return items.map((item) => exportCommandInterfaceItemToXML(context, item))
}

const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem
): CommandInterfaceItemXML => {
  const values: Partial<CommandInterfaceItemXML> = {
    Command: item.command,
    Type: item.type ?? "Auto",
    Attribute: item.attribute,
    Index: item.index,
    DefaultVisible: item.defaultVisible,
    CommandGroup: item.commandGroup,
  }

  if (item.visible) {
    const visibleXML = exportUserVisibleToXML(context, { type: "UserVisible", yaml: "Использование" }, item.visible)
    if (visibleXML) {
      values.Visible = visibleXML
    }
  }

  const orderedKeys = getOrderedCommandInterfaceItemXMLKeys(item)
  const result = {} as CommandInterfaceItemXML
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as unknown as Record<keyof CommandInterfaceItemXML, unknown>)[key] = value
    }
  }
  return result
}

const commandInterfaceItemModelToXmlKeys = {
  command: "Command",
  type: "Type",
  attribute: "Attribute",
  index: "Index",
  commandGroup: "CommandGroup",
  defaultVisible: "DefaultVisible",
  visible: "Visible",
} as const

const fallbackCommandInterfaceItemXMLKeys = [
  "Command",
  "Type",
  "Attribute",
  "Index",
  "DefaultVisible",
  "CommandGroup",
  "Visible",
] as const satisfies readonly (keyof CommandInterfaceItemXML)[]

const getOrderedCommandInterfaceItemXMLKeys = (
  item: CommandInterfaceItem
): (keyof CommandInterfaceItemXML)[] => {
  const result: (keyof CommandInterfaceItemXML)[] = []
  const added = new Set<keyof CommandInterfaceItemXML>()

  for (const sourceKey of Object.keys(item)) {
    const xmlKey = commandInterfaceItemModelToXmlKeys[sourceKey as keyof typeof commandInterfaceItemModelToXmlKeys]
    if (xmlKey !== undefined && !added.has(xmlKey)) {
      result.push(xmlKey)
      added.add(xmlKey)
    }
  }

  for (const xmlKey of fallbackCommandInterfaceItemXMLKeys) {
    if (!added.has(xmlKey)) {
      result.push(xmlKey)
      added.add(xmlKey)
    }
  }

  return result
}

registerTypeRule("CommandInterface", "exportToXML", exportCommandInterfaceToXML)
