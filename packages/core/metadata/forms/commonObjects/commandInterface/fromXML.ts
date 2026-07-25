import { ConfigurationContextFromXML } from "../../../context/types"
import { importBooleanFromXML } from "../../../commonObjects/boolean/fromXML"
import { importNumberFromXML } from "../../../commonObjects/number/fromXML"
import { importUserVisibleFromXML } from "../../../commonObjects/userVisible/fromXML"
import { registerTypeRule } from "../../../orchestration"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexXmlNodeLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { indexedUid } from "../../../configurationIndex/logicalAddress"

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
    attribute: item.Attribute,
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

  const orderedKeys: readonly (keyof CommandInterfaceItem)[] = context.fromXML.forReference
    ? getOrderedCommandInterfaceItemKeysFromXML(item)
    : nonReferenceCommandInterfaceItemKeys

  const result = {} as CommandInterfaceItem
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as unknown as Record<keyof CommandInterfaceItem, unknown>)[key] = value
    }
  }
  result.itemType = "CommandInterfaceItem"

  return result
}

const commandInterfaceItemXmlToModelKeys = {
  Command: "command",
  Type: "type",
  Attribute: "attribute",
  Index: "index",
  CommandGroup: "commandGroup",
  DefaultVisible: "defaultVisible",
  Visible: "visible",
} as const

const nonReferenceCommandInterfaceItemKeys = [
  "command",
  "type",
  "attribute",
  "defaultVisible",
  "index",
  "commandGroup",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]

const fallbackCommandInterfaceItemKeys = [
  "command",
  "type",
  "attribute",
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
registerTypeRule("CommandInterface", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || xml === null || typeof xml !== "object" || Array.isArray(xml)) return
  const commandInterface = xml as CommandInterfaceXML
  const base = getConfigurationIndexXmlNodeLogicalAddress(collection)
  collectItemOrders(collection, base, "NavigationPanel", commandInterface.NavigationPanel?.Item)
  collectItemOrders(collection, base, "CommandBar", commandInterface.CommandBar?.Item)
})

function collectItemOrders(
  collection: NonNullable<ReturnType<typeof getConfigurationIndexCollectionContext>>,
  base: string,
  section: "NavigationPanel" | "CommandBar",
  source: CommandInterfaceItemXML | CommandInterfaceItemXML[] | undefined
): void {
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  items.forEach((item, index) => {
    collection.collector.setOrder(indexedUid(base, section, index), Object.keys(item))
  })
}
