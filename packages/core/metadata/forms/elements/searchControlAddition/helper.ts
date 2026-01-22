import { SingleSearchControlAddition } from "./types"

export const getSearchControlAdditionName = (parentElement: { name: string }): string => {
  return `${parentElement.name}УправлениеПоиском`
}

export const isHasContent = (data: SingleSearchControlAddition): boolean => {
  if (data.childItems.length > 0) return true
  return Object.keys(data).filter((key) => key !== "childItems" && key !== "elementType").length > 0
}
