import { ConfigurationContextFromXML, isXmlElementNode, isEmptyXmlElement, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { importBooleanFromXML } from "../../../commonObjects/boolean/fromXML"
import { importNumberFromXML } from "../../../commonObjects/number/fromXML"
import { importUserVisibleFromXML } from "../../../commonObjects/userVisible/fromXML"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"

export const importCommandInterfaceFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: CommandInterfaceXML | XmlElementNode | undefined
): CommandInterface | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined

  const result: CommandInterface = {
    NavigationPanel: [],
    CommandBar: [],
    itemType: "CommandInterface",
  }

  if (isXmlElementNode(xml)) {
    for (const key of ["NavigationPanel", "CommandBar"] as const) {
      const panel = xmlElementChildren(xml, key)[0]
      if (panel !== undefined) result[key] = xmlElementChildren(panel, "Item").map(item => importCommandInterfaceItemFromXML(context, item))
    }
    return result
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
  item: CommandInterfaceItemXML | XmlElementNode
): CommandInterfaceItem => {
  const child = (name: string) => isXmlElementNode(item) ? xmlElementChildren(item, name)[0] : undefined
  const text = (name: string) => { const node = child(name); return node === undefined ? undefined : xmlTextValue(node) || undefined }
  const values: Partial<CommandInterfaceItem> = {
    command: String(isXmlElementNode(item) ? text("Command") : item.Command),
    type: isXmlElementNode(item) ? text("Type") : item.Type,
    attribute: isXmlElementNode(item) ? text("Attribute") : item.Attribute,
    index: importNumberFromXML(context, undefined, isXmlElementNode(item) ? child("Index") : item.Index),
    commandGroup: isXmlElementNode(item) ? text("CommandGroup") : item.CommandGroup,
  }

  const defaultVisible = importBooleanFromXML(context, undefined, isXmlElementNode(item) ? child("DefaultVisible") : item.DefaultVisible)
  if (defaultVisible === false) {
    values.defaultVisible = false
  }

  const visibleXML = isXmlElementNode(item) ? child("Visible") : item.Visible
  if (visibleXML) {
    const visible = importUserVisibleFromXML(context, undefined, visibleXML)
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
