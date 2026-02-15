import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportI8nTextToXML } from "../../commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "../../commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "../../commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "../../context/types"
import { Command, CommandXML } from "./types"

export const exportCommandsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: Command[] | undefined
): CommandXML[] | undefined => {
  if (!data || data.length === 0) return undefined
  return data.map((value: Command) => exportCommandToXML(context, value)!)
}

function exportCommandToXML(context: ConfigurationContext, command: Command | undefined): CommandXML | undefined {
  if (!command) return undefined

  const result: CommandXML = {
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

registerTypeRule("Commands", "exportToXML", exportCommandsToXML)
