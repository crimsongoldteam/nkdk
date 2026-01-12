import { BaseElement } from "../baseElement/types"
import { SearchControlAddition } from "./types"

export const getSearchControlAdditionName = (parentElement: BaseElement): string => {
  return `${parentElement.name}УправлениеПоиском`
}

export const isHasContent = (data: SearchControlAddition): boolean => {
  return Object.keys(data).length > 0
}
