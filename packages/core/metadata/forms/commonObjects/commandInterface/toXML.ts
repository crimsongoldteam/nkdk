import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/toXML"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"

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
      Item: exportCommandInterfaceItemsToXML(context, data.NavigationPanel, referenceData?.NavigationPanel),
    }
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.CommandBar = {
      Item: exportCommandInterfaceItemsToXML(context, data.CommandBar, referenceData?.CommandBar),
    }
  }

  if (Object.keys(result).length === 0) return undefined

  return result
}

const exportCommandInterfaceItemsToXML = (
  context: ConfigurationContext,
  items: CommandInterfaceItem[],
  referenceItems?: CommandInterfaceItem[] | undefined
): CommandInterfaceItemXML[] => {
  return items.map((item) =>
    exportCommandInterfaceItemToXML(context, item, findReferenceCommandInterfaceItem(item, referenceItems))
  )
}

const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem,
  referenceItem?: CommandInterfaceItem | undefined
): CommandInterfaceItemXML => {
  const values: Partial<CommandInterfaceItemXML> = {
    Command: item.command,
    Type: item.type ?? "Auto",
    Index: item.index,
    DefaultVisible: item.defaultVisible,
    CommandGroup: item.commandGroup,
  }

  if (item.visible) {
    const visibleXML = exportUserVisibleToXML(
      context,
      { type: "UserVisible", yaml: "РазрешитьИспользование", yamlDeny: "ЗапретитьИспользование" },
      item.visible
    )
    if (visibleXML) {
      values.Visible = visibleXML
    }
  }

  const orderedKeys = getOrderedCommandInterfaceItemXMLKeys(referenceItem)
  const result = {} as CommandInterfaceItemXML
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }

  return result
}

const commandInterfaceItemModelToXmlKeys = {
  command: "Command",
  type: "Type",
  index: "Index",
  commandGroup: "CommandGroup",
  defaultVisible: "DefaultVisible",
  visible: "Visible",
} as const

const fallbackCommandInterfaceItemXMLKeys = [
  "Command",
  "Type",
  "Index",
  "DefaultVisible",
  "CommandGroup",
  "Visible",
] as const satisfies readonly (keyof CommandInterfaceItemXML)[]

const findReferenceCommandInterfaceItem = (
  item: CommandInterfaceItem,
  referenceItems: CommandInterfaceItem[] | undefined
): CommandInterfaceItem | undefined => {
  if (!referenceItems) return undefined

  const matches = referenceItems.filter(
    (referenceItem) => referenceItem.command === item.command && referenceItem.commandGroup === item.commandGroup
  )

  return matches.length === 1 ? matches[0] : undefined
}

const getOrderedCommandInterfaceItemXMLKeys = (
  referenceItem: CommandInterfaceItem | undefined
): (keyof CommandInterfaceItemXML)[] => {
  if (!referenceItem) return [...fallbackCommandInterfaceItemXMLKeys]

  const result: (keyof CommandInterfaceItemXML)[] = []
  const added = new Set<keyof CommandInterfaceItemXML>()

  for (const modelKey of Object.keys(referenceItem)) {
    const xmlKey = commandInterfaceItemModelToXmlKeys[modelKey as keyof typeof commandInterfaceItemModelToXmlKeys]
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
