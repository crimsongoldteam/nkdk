import { ExtendedTooltip } from "./types"

export const getExtendedTooltipName = (parentElement: { name: string }): string => {
  return `${parentElement.name}РасширеннаяПодсказка`
}

const EXCLUDED_FIELDS = ["name", "itemType"]

export const isHasContent = (data: ExtendedTooltip): boolean => {
  const keys = Object.keys(data)
  const hasOtherFields = keys.some((key) => !EXCLUDED_FIELDS.includes(key))
  return hasOtherFields
}
