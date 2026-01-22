import { SingleSearchStringAddition } from "./types"

export const getSearchStringAdditionName = (parentElement: { name: string }): string => {
  return `${parentElement.name}СтрокаПоиска`
}

export const isHasContent = (data: SingleSearchStringAddition): boolean => {
  return Object.keys(data).filter((key) => key !== "elementType").length > 0
}
