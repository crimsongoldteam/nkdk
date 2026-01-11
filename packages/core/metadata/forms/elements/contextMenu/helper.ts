import { BaseElement } from "../baseElement/types"
import { ContextMenu } from "./types"

export const getContextMenuName = (parentElement: BaseElement): string => {
  return `${parentElement.name}КонтекстноеМеню`
}

export const isHasContent = (data: ContextMenu | undefined): boolean => {
  if (!data) return false

  if (data.childItems.length > 0) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => key !== "childItems")

  return hasOtherFields
}
