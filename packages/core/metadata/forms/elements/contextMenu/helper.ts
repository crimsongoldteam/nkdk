import { BaseElement } from "../baseElement/types"
import { ContextMenu } from "./types"

export const getContextMenuName = (parentElement: BaseElement): string => {
  return `${parentElement.name}КонтекстноеМеню`
}

export const isDefaultContextMenuName = (parentElement: BaseElement, contextMenu: ContextMenu): boolean => {
  return contextMenu.name === getContextMenuName(parentElement)
}
