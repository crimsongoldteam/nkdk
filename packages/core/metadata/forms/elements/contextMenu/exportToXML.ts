import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportButtonGroupChildItemsToXML } from "../../collections/buttonGroupChildItems/exportToXML"
import { getContextMenuName } from "./helper"
import { ToXMLType } from "~/metadata/metadataFactory/types"

export function exportContextMenuToXML<From extends ContextMenu | undefined>(
  context: ConfigurationContext,
  data: From,
  parentElement: { name: string }
): ToXMLType<From> {
  const result: ContextMenuXML = {
    _name: getContextMenuName(parentElement),
    _id: getElementId(context),
  }

  if (data === undefined) return result as ToXMLType<From>

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.autofill !== undefined) result.Autofill = data.autofill

  const childItems = exportButtonGroupChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  return sortObject(result) as ToXMLType<From>
}
