import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ExportToXMLFunctionNew, MetadataItem, registerTypeRule } from "~/metadata/metadataFactory"
import { FormCommand, FormCommandXML } from "./types"

export const exportCommandsToXML = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: FormCommand[] | undefined
  metadataItem?: MetadataItem
}): { Command: FormCommandXML[] } | undefined => {
  const { context, value: data } = params
  if (!data || data.length === 0) return undefined

  const result: FormCommandXML[] = data.map((value: FormCommand) => exportCommandToXML(context, value)!)
  return { Command: result }
}

function exportCommandToXML(
  context: ConfigurationContext,
  command: FormCommand | undefined
): FormCommandXML | undefined {
  if (!command) return undefined

  const result: FormCommandXML = {
    _name: command.name,
    _id: getElementId(context),
  }

  if (command.action !== undefined) {
    result.Action = command.action
  }

  if (command.table !== undefined) {
    result.AssociatedTableElementId = {
      "_xsi:type": "xs:string",
      "#text": command.table,
    }
  }

  if (command.currentRowUse !== undefined) {
    result.CurrentRowUse = command.currentRowUse
  }

  if (command.modifiesSavedData !== undefined) {
    result.ModifiesSavedData = command.modifiesSavedData
  }

  const picture = exportPictureToXML(context, undefined, command.picture)
  if (picture !== undefined) result.Picture = picture

  if (command.representation !== undefined) result.Representation = command.representation

  if (command.shortcut !== undefined) {
    result.Shortcut = command.shortcut
  }

  if (command.title !== undefined) {
    result.Title = exportI8nTextToXML(context, { type: "I8nText" }, command.title)
  }

  if (command.toolTip !== undefined) {
    result.ToolTip = exportI8nTextToXML(context, { type: "I8nText" }, command.toolTip)
  }

  const use = exportUserVisibleToXML(context, undefined, command.use)
  if (use !== undefined) result.Use = use

  return result
}

registerTypeRule("FormCommands", "exportToXML", exportCommandsToXML as ExportToXMLFunctionNew)
