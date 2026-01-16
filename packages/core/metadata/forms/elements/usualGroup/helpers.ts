import { ConfigurationContext } from "~/metadata/context/types"
import { isOneLineElement } from "../../format/isOneLineElementCheckFactory"
import { UsualGroup } from "./types"

export const isOneLineGroup = (_context: ConfigurationContext, element: UsualGroup): boolean => {
  if (!isHorizontalGroup(element)) return false

  // Only explicitly showing title (showTitle === true) prevents one-line format
  if (element.showTitle === true) return false

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
