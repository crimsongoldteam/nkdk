import { Context } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const exportBooleanToEnterprise = (
  _configurationSettings: Context,
  value: boolean | undefined
): StringboolEnterprise | undefined => {
  if (value === undefined) return undefined
  return value ? "Истина" : "Ложь"
}
