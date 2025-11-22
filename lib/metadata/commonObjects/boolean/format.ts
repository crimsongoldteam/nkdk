import { TBoolEnterprise } from "./types"

export const formatBoolean = (
  value: boolean | undefined
): TBoolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
