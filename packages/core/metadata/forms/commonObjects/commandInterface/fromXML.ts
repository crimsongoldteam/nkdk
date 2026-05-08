import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importBooleanFromXML } from "~/metadata/commonObjects/boolean/fromXML"
import { importNumberFromXML } from "~/metadata/commonObjects/number/fromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/fromXML"
import { registerTypeRule } from "~/metadata/orchestration"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"

export const importCommandInterfaceFromXML = (
  context: ConfigurationContextFromXML,
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
    result.NavigationPanel = items.map((item) => importCommandInterfaceItemFromXML(context, item))
  }

  if (xml.CommandBar?.Item) {
    const items = Array.isArray(xml.CommandBar.Item) ? xml.CommandBar.Item : [xml.CommandBar.Item]
    result.CommandBar = items.map((item) => importCommandInterfaceItemFromXML(context, item))
  }

  return result
}

const importCommandInterfaceItemFromXML = (
  context: ConfigurationContextFromXML,
  item: CommandInterfaceItemXML
): CommandInterfaceItem => {
  const values: Partial<CommandInterfaceItem> = {
    command: String(item.Command),
    type: item.Type,
    index: importNumberFromXML(context, undefined, item.Index),
    commandGroup: item.CommandGroup,
  }

  const defaultVisible = importBooleanFromXML(context, undefined, item.DefaultVisible)
  if (defaultVisible === false) {
    values.defaultVisible = false
  }

  if (item.Visible) {
    const visible = importUserVisibleFromXML(context, undefined, item.Visible)
    if (visible) {
      values.visible = visible
    }
  }

  const orderedKeys = context.fromXML.forReference
    ? getOrderedCommandInterfaceItemKeysFromXML(item)
    : ["command", "type", "defaultVisible", "index", "commandGroup", "visible"]

  const result = {} as CommandInterfaceItem
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  result.itemType = "CommandInterfaceItem"

  return result
}

const commandInterfaceItemXmlToModelKeys = {
  Command: "command",
  Type: "type",
  Index: "index",
  CommandGroup: "commandGroup",
  DefaultVisible: "defaultVisible",
  Visible: "visible",
} as const

const fallbackCommandInterfaceItemKeys = [
  "command",
  "type",
  "index",
  "commandGroup",
  "defaultVisible",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]

const getOrderedCommandInterfaceItemKeysFromXML = (item: CommandInterfaceItemXML): (keyof CommandInterfaceItem)[] => {
  const result: (keyof CommandInterfaceItem)[] = []
  const added = new Set<keyof CommandInterfaceItem>()

  for (const xmlKey of Object.keys(item)) {
    const key = commandInterfaceItemXmlToModelKeys[xmlKey as keyof typeof commandInterfaceItemXmlToModelKeys]
    if (key !== undefined && !added.has(key)) {
      result.push(key)
      added.add(key)
    }
  }

  for (const key of fallbackCommandInterfaceItemKeys) {
    if (!added.has(key)) {
      result.push(key)
      added.add(key)
    }
  }

  return result
}

registerTypeRule("CommandInterface", "importFromXML", importCommandInterfaceFromXML)
