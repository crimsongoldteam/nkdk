import { SingleViewStatusAddition } from "./types"

export const getViewStatusAdditionName = (parentElement: { name: string }): string => {
  return `${parentElement.name}СостояниеПросмотра`
}

export const isHasContent = (data: SingleViewStatusAddition): boolean => {
  return Object.keys(data).length > 0
}
