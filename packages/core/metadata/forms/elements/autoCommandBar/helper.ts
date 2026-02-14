import { AutoCommandBar } from "./types"

export const getAutoCommandBarName = (parentElement: { name: string }): string => {
  return `${parentElement.name}КоманднаяПанель`
}

const EXCLUDED_FIELDS = ["name", "itemType", "childItems"]

export const isHasContent = (data: AutoCommandBar): boolean => {
  if (data.childItems.length != 0) return true

  const keys = Object.keys(data)
  const hasOtherFields = keys.some(
    (key) => !EXCLUDED_FIELDS.includes(key) && (key !== "autofill" || data.autofill !== true)
  )

  return hasOtherFields
}
