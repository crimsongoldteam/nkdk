import { BaseElement } from "../baseElement/types"
import { SearchStringAddition } from "./types"

export const getSearchStringAdditionName = (parentElement: BaseElement): string => {
  return `${parentElement.name}СтрокаПоиска`
}

export const isHasContent = (data: SearchStringAddition): boolean => {
  return Object.keys(data).length > 0
}
