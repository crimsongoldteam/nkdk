import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { BaseElement } from "../baseElement/types"
import { isDefaultContextMenuName } from "./helper"

export const importContextMenuFromXML = <T extends ContextMenu | undefined>(
  context: ConfigurationContext,
  xml: ContextMenuXML | undefined,
  parentElement: BaseElement
): T | undefined => {
  if (!xml) return undefined as T

  const result: ContextMenu = {
    ...importBaseElementFromXML(context, xml),
    elementType: FormElementType.FormGroup,
  }

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Autofill !== undefined) result.autofill = xml.Autofill

  const childItems = importChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined) result.childItems = childItems

  if (isHasContent(parentElement, result)) return result as T

  return undefined
}

const isHasContent = (parentElement: BaseElement, data: ContextMenu | undefined): boolean => {
  if (!data) return false

  if (!isDefaultContextMenuName(parentElement, data)) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => key !== "name" && key !== "id" && key !== "elementType")

  return hasOtherFields
}
