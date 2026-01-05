import { isOneLineElement } from "~/format/isOneLineElementCheckFactory"
import { UsualGroup } from "./types"

export const isOneLineGroup = (element: UsualGroup): boolean => {
  if (!isHorizontalGroup(element)) return false

  if (element.showTitle) return false

  for (const item of element.childItems || []) {
    if (!isOneLineElement(item)) return false
  }

  return true
}

export const isHorizontalGroup = (element: UsualGroup): boolean => {
  return !isVerticalGroup(element)
}

export const isVerticalGroup = (element: UsualGroup): boolean => {
  return element.group === "Vertical"
}
