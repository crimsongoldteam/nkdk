import { BaseElement } from "../baseElement/types"
import { ViewStatusAddition } from "./types"

export const getViewStatusAdditionName = (parentElement: BaseElement): string => {
  return `${parentElement.name}СостояниеПросмотра`
}

export const isHasContent = (data: ViewStatusAddition): boolean => {
  return Object.keys(data).length > 0
}
