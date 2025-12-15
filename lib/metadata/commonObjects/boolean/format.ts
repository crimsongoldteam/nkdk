import { StringboolEnterprise } from "./types"

export const formatBoolean = (value: boolean | undefined): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
