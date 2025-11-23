import { isOneLineElement } from "~/lib/format/isOneLineElementCheckFactory"
import { ZChildFormItemsGroup } from "~/lib/metadata/systemEnumerations/types"
import { TUsualGroup } from "./types"

export const isOneLineGroup = (element: TUsualGroup): boolean => {
  if (!isHorizontalGroup(element)) return false

  if (element.showTitle) return false

  for (const item of element.childItems) {
    if (!isOneLineElement(item)) return false
  }

  return true
}

export const isHorizontalGroup = (element: TUsualGroup): boolean => {
  return !isVerticalGroup(element)
}

export const isVerticalGroup = (element: TUsualGroup): boolean => {
  return element.group === ZChildFormItemsGroup.enum.Vertical
}
