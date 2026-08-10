import { ConfigurationContextFromXML } from "../../../context/types"
import { importBooleanFromXML } from "../../../commonObjects/boolean/fromXML"
import { importNumberFromXML } from "../../../commonObjects/number/fromXML"
import { importUserVisibleFromXML } from "../../../commonObjects/userVisible/fromXML"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
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

  const result = {} as CommandInterfaceItem
  for (const key of commandInterfaceItemKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as unknown as Record<keyof CommandInterfaceItem, unknown>)[key] = value
    }
  }
  result.itemType = "CommandInterfaceItem"

  return result
}

const commandInterfaceItemKeys = [
  "command",
  "type",
  "attribute",
  "commandGroup",
  "index",
  "defaultVisible",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]

export const metadataPropertyRule000 = definePropertyTypeRule("CommandInterface", "importFromXML", importCommandInterfaceFromXML)
