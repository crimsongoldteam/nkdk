import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { getElementId } from "~/metadata/helpers/getElementId"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { BaseElement } from "../baseElement/types"
import { getContextMenuName } from "./helper"

export const exportContextMenuToXML = <T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  data: T,
  parentElement: BaseElement
): ContextMenuXML => {
  const result: ContextMenuXML = {
    _name: getContextMenuName(parentElement),
    _id: getElementId(context),
  }

  if (!data) return result

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.autofill !== undefined) result.Autofill = data.autofill

  const childItems = exportChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  return result
}
