import { ConfigurationContext } from "~/metadata/context/types"
import { ContextMenu, ContextMenuXML } from "~/metadata/forms/elements/contextMenu/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { BaseElement } from "../baseElement/types"
import { isDefaultContextMenuName } from "./helper"

export const importContextMenuFromXML = (
  context: ConfigurationContext,
  xml: ContextMenuXML | undefined,
  parentElement: BaseElement
): ContextMenu | undefined => {
  const result = importFormGroupFromXML(context, xml)

  if (isHasContent(parentElement, result)) return result

  return undefined
}

const isHasContent = (parentElement: BaseElement, data: ContextMenu | undefined): boolean => {
  if (!data) return false

  if (!isDefaultContextMenuName(parentElement, data)) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => key !== "name" && key !== "id" && key !== "elementType")

  return hasOtherFields
}
