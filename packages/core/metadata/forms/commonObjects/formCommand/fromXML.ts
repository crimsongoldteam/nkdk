import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { importMetadataValueFromXMLAsPrimitive } from "~/metadata/commonObjects/metadataValue/fromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/fromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/fromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { FormCommand, FormCommands, FormCommandsXML, FormCommandXML } from "./types"

function importCommandFromXML(context: ConfigurationContext, xml: FormCommandXML | undefined): FormCommand | undefined {
  if (!xml) return undefined

  const result: FormCommand = {
    itemType: "FormCommand",
    name: xml._name,
  }

  const title = importI8nTextFromXML(context, { type: "I8nText" }, xml.Title)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromXML(context, { type: "I8nText" }, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.Action !== undefined) result.action = xml.Action

  if (xml.CurrentRowUse !== undefined) result.currentRowUse = xml.CurrentRowUse

  if (xml.ModifiesSavedData !== undefined) result.modifiesSavedData = xml.ModifiesSavedData

  const table = importMetadataValueFromXMLAsPrimitive(context, undefined, xml.AssociatedTableElementId, "string")
  if (table !== undefined) result.table = table

  const use = importUserVisibleFromXML(context, undefined, xml.Use)
  if (use !== undefined) result.use = use

  const picture = importPictureFromXML(context, undefined, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.Representation !== undefined) result.representation = xml.Representation

  return result
}

export function importCommandsFromXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: { Command: FormCommandsXML } | undefined
): FormCommands {
  if (!xml || !xml.Command) return []

  const xmlArray = Array.isArray(xml.Command) ? xml.Command : [xml.Command]

  return xmlArray.map((commandXml) => importCommandFromXML(context, commandXml)!)
}

registerTypeRule("FormCommands", "importFromXML", importCommandsFromXML)
