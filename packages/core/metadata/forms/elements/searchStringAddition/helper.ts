import { SearchStringAddition } from "./types"

export const getSearchStringAdditionName = (parentElement: { name: string }): string => {
  return `${parentElement.name}СтрокаПоиска`
}

export const isHasContent = (data: SearchStringAddition): boolean => {
  return Object.keys(data).length > 0
}
