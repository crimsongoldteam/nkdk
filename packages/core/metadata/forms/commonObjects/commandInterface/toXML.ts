import { exportUserVisibleToXML } from "../../../commonObjects/userVisible/toXML"
import { registerTypeRule } from "../../../orchestration"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"
import type { ConfigurationIndexExportRuntime } from "../../../configurationIndex/exportRuntime"
import { indexedUid } from "../../../configurationIndex/logicalAddress"

export const exportCommandInterfaceToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterface | undefined,
  referenceData?: CommandInterface | undefined
): CommandInterfaceXML | undefined => {
  if (!data) return undefined

  const result: CommandInterfaceXML = {}

  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.NavigationPanel = {
      Item: exportCommandInterfaceItemsToXML(context, "NavigationPanel", data.NavigationPanel, referenceData?.NavigationPanel),
    }
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.CommandBar = {
      Item: exportCommandInterfaceItemsToXML(context, "CommandBar", data.CommandBar, referenceData?.CommandBar),
    }
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportCommandInterfaceItemsToXML = (
  context: ConfigurationContext,
  section: "NavigationPanel" | "CommandBar",
  items: CommandInterfaceItem[],
  referenceItems?: CommandInterfaceItem[] | undefined
): CommandInterfaceItemXML[] => {
  return items.map((item, index) =>
    exportCommandInterfaceItemToXML(context, section, index, item, findReferenceCommandInterfaceItem(item, referenceItems))
  )
}

const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
  section: "NavigationPanel" | "CommandBar",
  index: number,
  item: CommandInterfaceItem,
  referenceItem?: CommandInterfaceItem | undefined
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

  const indexedOrder = commandInterfaceItemOrderFromIndex(context, section, index)
  const orderedKeys = getOrderedCommandInterfaceItemXMLKeys(referenceItem, indexedOrder)
  const result = {} as CommandInterfaceItemXML
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as unknown as Record<keyof CommandInterfaceItemXML, unknown>)[key] = value
    }
  }
  collectCommandInterfaceItemOrder(context, section, index, orderedKeys)

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

const commandInterfaceItemIdentityKeys = ["command", "type", "attribute", "index", "commandGroup"] as const

const commandInterfaceItemValueEquals = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const commandInterfaceItemFullIdentityMatches = (
  item: CommandInterfaceItem,
  referenceItem: CommandInterfaceItem
): boolean =>
  commandInterfaceItemIdentityKeys.every((key) => commandInterfaceItemValueEquals(item[key], referenceItem[key]))

const commandInterfaceItemCoarseIdentityMatches = (
  item: CommandInterfaceItem,
  referenceItem: CommandInterfaceItem
): boolean =>
  referenceItem.command === item.command &&
  referenceItem.commandGroup === item.commandGroup &&
  referenceItem.index === item.index

const findReferenceCommandInterfaceItem = (
  item: CommandInterfaceItem,
  referenceItems: CommandInterfaceItem[] | undefined
): CommandInterfaceItem | undefined => {
  if (!referenceItems) return undefined

  return (
    referenceItems.find((referenceItem) => commandInterfaceItemFullIdentityMatches(item, referenceItem)) ??
    referenceItems.find((referenceItem) => commandInterfaceItemCoarseIdentityMatches(item, referenceItem))
  )
}

const getOrderedCommandInterfaceItemXMLKeys = (
  referenceItem: CommandInterfaceItem | undefined,
  indexedOrder: readonly string[] = []
): (keyof CommandInterfaceItemXML)[] => {
  if (!referenceItem && indexedOrder.length === 0) return [...fallbackCommandInterfaceItemXMLKeys]

  const result: (keyof CommandInterfaceItemXML)[] = []
  const added = new Set<keyof CommandInterfaceItemXML>()

  for (const sourceKey of referenceItem === undefined ? indexedOrder : Object.keys(referenceItem)) {
    const xmlKey =
      referenceItem === undefined
        ? (sourceKey as keyof CommandInterfaceItemXML)
        : commandInterfaceItemModelToXmlKeys[sourceKey as keyof typeof commandInterfaceItemModelToXmlKeys]
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

function commandInterfaceItemOrderFromIndex(
  context: ConfigurationContext,
  section: "NavigationPanel" | "CommandBar",
  index: number
): readonly string[] {
  const runtime = configurationIndexRuntime(context)
  if (runtime === undefined) return []
  const base = runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress
  return runtime.xmlNode(indexedUid(base, section, index))?.order ?? []
}

function collectCommandInterfaceItemOrder(
  context: ConfigurationContext,
  section: "NavigationPanel" | "CommandBar",
  index: number,
  order: readonly string[]
): void {
  const runtime = configurationIndexRuntime(context)
  if (runtime === undefined) return
  const base = runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress
  runtime.collector.setOrder(indexedUid(base, section, index), order)
}

function configurationIndexRuntime(context: ConfigurationContext): ConfigurationIndexExportRuntime | undefined {
  return (context as ConfigurationContext & { exportToXML?: { configurationIndex?: ConfigurationIndexExportRuntime } })
    .exportToXML?.configurationIndex
}

registerTypeRule("CommandInterface", "exportToXML", exportCommandInterfaceToXML)
