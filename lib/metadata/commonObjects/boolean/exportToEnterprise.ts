import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (data: boolean | undefined): StringboolEnterprise | undefined => {
  if (!data) return undefined
  return data ? "Истина" : "Ложь"
}
