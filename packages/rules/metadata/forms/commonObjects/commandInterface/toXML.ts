import { exportUserVisibleToXML } from "../../../commonObjects/userVisible/toXML"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContext } from "@nkdk/runtime"
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
    CommandGroup: item.commandGroup,
    Index: item.index,
    DefaultVisible: item.defaultVisible,
  }

  if (item.visible) {
    const visibleXML = exportUserVisibleToXML(context, { type: "UserVisible", yaml: "Использование" }, item.visible)
    if (visibleXML) {
      values.Visible = visibleXML
    }
  }

  const result = {} as CommandInterfaceItemXML
  for (const key of commandInterfaceItemXMLKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as unknown as Record<keyof CommandInterfaceItemXML, unknown>)[key] = value
    }
  }
  return result
}

const commandInterfaceItemXMLKeys = [
  "Command",
  "Type",
  "Attribute",
  "CommandGroup",
  "Index",
  "DefaultVisible",
  "Visible",
] as const satisfies readonly (keyof CommandInterfaceItemXML)[]

export const metadataPropertyRule000 = definePropertyTypeRule("CommandInterface", "exportToXML", exportCommandInterfaceToXML)
