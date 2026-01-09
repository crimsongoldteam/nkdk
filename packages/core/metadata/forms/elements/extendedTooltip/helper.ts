import { BaseElement } from "../baseElement/types"
import { ExtendedTooltip } from "./types"

export const getExtendedTooltipName = (parentElement: BaseElement): string => {
  return `${parentElement.name}РасширеннаяПодсказка`
}

export const isDefaultExtendedTooltipName = (parentElement: BaseElement, extendedTooltip: ExtendedTooltip): boolean => {
  return extendedTooltip.name === getExtendedTooltipName(parentElement)
}
