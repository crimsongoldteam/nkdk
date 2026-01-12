import { BaseElement } from "../baseElement/types"

export const getExtendedTooltipName = (parentElement: BaseElement): string => {
  return `${parentElement.name}РасширеннаяПодсказка`
}
