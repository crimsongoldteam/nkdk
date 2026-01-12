import { BaseElement } from "../baseElement/types"
import { SearchStringAddition } from "./types"

export const getSearchStringAdditionName = (parentElement?: BaseElement): string => {
  if (!parentElement) return "СтрокаПоиска"

  return `${parentElement.name}СтрокаПоиска`
}

export const isHasContent = (data: SearchStringAddition): boolean => {
  return Object.keys(data).length > 0
}
