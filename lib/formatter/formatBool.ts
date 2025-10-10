import { TBoolEnterprise } from "./types"

export const formatBool = (value: boolean | undefined): TBoolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
