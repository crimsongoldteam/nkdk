import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportCommandBarChildItemsToXML } from "../../collections/commandBarChildItems/exportToXML"
import { exportElementPropsToXML } from "../baseElement/exportToXML"
import { getDefaultContextMenu } from "./defaults"
import { getContextMenuName } from "./helper"

export function exportContextMenuToXML(
  context: ConfigurationContext,
  data: ContextMenu | undefined,
  parentElement: { name: string }
): ContextMenuXML {
  const contextMenu = data ?? getDefaultContextMenu()
  const name = getContextMenuName(parentElement)
  const baseFields = exportElementPropsToXML(context, { name })
  const result: ContextMenuXML = { ...baseFields }

  if (contextMenu.displayImportance !== undefined) result._DisplayImportance = contextMenu.displayImportance

  if (contextMenu.autofill !== undefined) result.Autofill = contextMenu.autofill

  const childItems = exportCommandBarChildItemsToXML(context, contextMenu.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  return sortObject(result)
}
