import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { BaseElement } from "../baseElement/types"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { getContextMenuName } from "./helper"

export const exportContextMenuToXML = <T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  data: T,
  parentElement: BaseElement
): ContextMenuXML => {
  const contextMenu = data ?? getDefaultContextMenu(parentElement)

  const baseFields = exportBaseElementToXML(context, contextMenu)

  const result: ContextMenuXML = {
    ...baseFields,
  }

  if (contextMenu.displayImportance !== undefined) result._DisplayImportance = contextMenu.displayImportance

  if (contextMenu.autofill !== undefined) result.Autofill = contextMenu.autofill

  const childItems = exportChildItemsToXML(context, contextMenu.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  return result
}

const getDefaultContextMenu = (parentElement: BaseElement): ContextMenu => {
  return { name: getContextMenuName(parentElement), elementType: FormElementType.FormGroup }
}
