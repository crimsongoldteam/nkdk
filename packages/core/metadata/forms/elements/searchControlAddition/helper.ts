import { BaseElement } from "../baseElement/types"
import { SearchControlAddition } from "./types"

export const getSearchControlAdditionName = (parentElement: BaseElement): string => {
  return `${parentElement.name}УправленияПоиском`
}

export const isHasContent = (data: SearchControlAddition): boolean => {
  if (data.childItems.length > 0) return true
  return Object.keys(data).filter((key) => key !== "childItems").length > 0
}
